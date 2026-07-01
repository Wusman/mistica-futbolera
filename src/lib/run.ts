/* ══════════════════════════════════════════
   run.ts — la corrida como función PURA (fundación del share-code).

   playRun(log) reproduce una corrida completa fuera de React, a partir de la
   semilla + las decisiones del jugador (el RunLog). Replica la máquina de
   estados del reducer de App.tsx, pero headless: el modo espectador y la
   verificación del Worker la usan tal cual.

   Determinista: mismo RunLog → mismo RunResult, siempre. Sin React, sin DOM,
   sin reloj, sin red. Todo el azar sigue saliendo de la semilla vía engine.ts.
══════════════════════════════════════════ */

import { type Player, type FormationName, FORMATIONS, TEAMS } from '../data/players';
import {
  type Lineup,
  type Attitude,
  type PenAim,
  type Scorer,
  type TickerEvent,
  type PenKickResult,
  type OppPenResult,
  emptyLineup,
  lineupFilled,
  lineupXI,
  draftTeamAt,
  openSlotsFor,
  playHalf,
  halfEvents,
  halfPenalty,
  addedTime,
  penKick,
  oppPenShot,
  pensTurn,
  shootoutWinner,
  bestXI,
  scaledRivalOf,
  pickOpponent,
  avg,
} from './engine';
import {
  type Stage,
  type MatchView,
  type Campaign,
  LADDER,
  isTwoLegged,
  emptyStats,
  matchSeedFor,
  settleMatch,
  settleH2,
} from './tournament';

const STARTING_PASSES = 3; // debe coincidir con App.tsx

/* ── El RunLog: decisiones del jugador, por categoría ──
   Lo que NO está acá lo regenera la semilla (qué equipo sale en cada paso,
   el relato, los rivales). Cada lista se consume EN ORDEN DE OCURRENCIA.

   - draft:     una entrada por paso DECIDIBLE del draft (los saltos forzados,
                cuando el equipo no ofrece a nadie elegible, se reproducen
                solos y no ocupan lugar). pick.player = id global `i`; el codec
                lo comprimirá luego a índice relativo.
   - attitudes: una por partido jugado, en orden.
   - penAims:   palo de cada penal EN JUGADA (1T índice 97, 2T índice 98), en
                orden de aparición, sea tu remate o la estirada de tu arquero.
   - shoot:     palo (tu remate) o estirada (tu arquero) en cada penal de
                tanda, en orden de turno. */
export type DraftMove =
  | { pick: { player: number; slot: number } }
  | { pass: true };

export interface RunLog {
  v: number;
  seed: number;
  formation: FormationName;
  draft: DraftMove[];
  attitudes: Attitude[];
  penAims: PenAim[];
  shoot: PenAim[];
}

export const RUN_VERSION = 1;

export interface RunResult {
  ok: boolean;
  error?: string;
  champion: boolean;
  stage: Stage;          // etapa donde terminó la corrida
  matches: MatchView[];  // todos los partidos, en orden (para el espectador)
  stats: { pj: number; w: number; d: number; l: number; gf: number; ga: number; cs: number };
  xi: Player[];
  xiAvg: number;
}

const teamById = (id: string) => TEAMS.find((t) => t.id === id)!;

/* Cursores: avanzan de forma independiente, en orden de ocurrencia. Si una
   lista se queda corta, el log es inválido (ok:false). */
interface Cursors { draft: number; att: number; pen: number; shoot: number; }

/* ── Reproducir el draft desde el log para reconstruir el once ── */
function replayDraft(log: RunLog, cur: Cursors): { lineup: Lineup } | { error: string } {
  const lineup = emptyLineup(log.formation);
  let passes = STARTING_PASSES;
  let step = 0;
  let guard = 0; // corta cualquier bucle infinito (no debería pasar)

  while (!lineupFilled(lineup)) {
    if (guard++ > 5000) return { error: 'draft_no_converge' };
    const team = draftTeamAt(log.seed, step);
    const taken = new Set(lineup.filter((c): c is Player => c !== null).map((p) => p.i));
    const eligible = team.players.filter(
      (p) => !taken.has(p.i) && openSlotsFor(p, lineup, log.formation).length > 0,
    );

    if (eligible.length === 0) { step++; continue; } // salto forzado: 0 decisiones

    const mv = log.draft[cur.draft++];
    if (!mv) return { error: 'draft_corto' };

    if ('pass' in mv) {
      if (passes <= 0) return { error: 'pass_sin_saldo' };
      passes--; step++; continue;
    }

    const player = eligible.find((p) => p.i === mv.pick.player);
    if (!player) return { error: 'pick_no_elegible' };
    const slots = openSlotsFor(player, lineup, log.formation);
    if (!slots.includes(mv.pick.slot)) return { error: 'slot_invalido' };
    lineup[mv.pick.slot] = player;
    step++;
  }
  return { lineup };
}

/* ── Aplicar un penal EN JUGADA (1T o 2T): replica HALF_PEN / H2_PEN ──
   Ajusta goles/relato/goleadores en el lado correspondiente y devuelve los
   valores corregidos. `idxStream` = 97 (1T) o 98 (2T). */
function applyInPlayPen(
  ms: number, idxStream: number, side: 'you' | 'opp', min: number, aim: PenAim,
  xiAvg: number, ov: number,
  gf: number, ga: number, sc: Scorer[], ev: TickerEvent[],
): { scored: boolean; gf: number; ga: number; sc: Scorer[]; ev: TickerEvent[] } {
  const res = side === 'you'
    ? penKick(ms, idxStream, aim, xiAvg, ov)
    : oppPenShot(ms, idxStream, aim, xiAvg, ov);

  const idx = ev.findIndex((e) => e.min === min && e.side === side);
  if (res.scored) {
    ev = ev.map((e, i) => (i === idx ? { ...e, p: true } : e));
  } else if (idx >= 0) {
    const gone = ev[idx];
    ev = ev.filter((_, i) => i !== idx);
    if (side === 'you') {
      gf -= 1;
      const si = sc.findIndex((s) => s.n === gone.n);
      if (si >= 0) sc = sc.filter((_, i) => i !== si);
    } else {
      ga -= 1;
    }
  }
  return { scored: res.scored, gf, ga, sc, ev };
}

/* ── Jugar un partido completo: preview → fulltime (con tanda si toca) ──
   Replica KICKOFF → (HALF_PEN) → DECIDE → (H2_PEN) → settleH2 → (tanda) →
   PENS_DONE. Devuelve el Campaign liquidado (sub 'fulltime', con done si la
   corrida terminó acá). */
function playMatch(c: Campaign, log: RunLog, cur: Cursors): Campaign | { error: string } {
  const seed = log.seed;
  const stage: Stage = LADDER[c.stageIdx];
  const opp = teamById(c.oppId);
  const xiAvg = avg(c.xi);
  const ms = matchSeedFor(seed, c.stageIdx, c.leg);
  const ov = scaledRivalOf(opp, c.stageIdx).overall;

  // ── 1er tiempo (siempre actitud 'eq') ──
  const h1 = playHalf(ms, 1, c.xi, ov, 'eq');
  let gf1 = h1.gf, ga1 = h1.ga;
  let sc1 = h1.scorers;
  let ev1 = halfEvents(ms, 1, h1, bestXI(opp));
  const end1 = 45 + addedTime(ms, 1); void end1; // (no afecta el resultado)
  const pen1 = halfPenalty(ms, 1, ev1);
  if (pen1) {
    const aim = log.penAims[cur.pen++];
    if (!aim) return { error: 'penAims_corto_1t' };
    const r = applyInPlayPen(ms, 97, pen1.side, pen1.min, aim, xiAvg, ov, gf1, ga1, sc1, ev1);
    gf1 = r.gf; ga1 = r.ga; sc1 = r.sc; ev1 = r.ev;
  }

  // ── decisión de entretiempo → 2do tiempo ──
  const attitude = log.attitudes[cur.att++];
  if (!attitude) return { error: 'attitudes_corto' };
  const h2 = playHalf(ms, 2, c.xi, ov, attitude);
  let gf2 = h2.gf, ga2 = h2.ga;
  let sc2 = h2.scorers;
  let ev2 = halfEvents(ms, 2, h2, bestXI(opp));
  const end2 = 90 + addedTime(ms, 2);
  let resume: number | undefined;
  const pen2 = halfPenalty(ms, 2, ev2);
  if (pen2) {
    const aim = log.penAims[cur.pen++];
    if (!aim) return { error: 'penAims_corto_2t' };
    const r = applyInPlayPen(ms, 98, pen2.side, pen2.min, aim, xiAvg, ov, gf2, ga2, sc2, ev2);
    gf2 = r.gf; ga2 = r.ga; sc2 = r.sc; ev2 = r.ev;
    resume = pen2.min;
  }

  // ── cierre del 2T (puede derivar a tanda) ──
  const c2 = settleH2(
    c, stage, opp.name, opp.edition,
    { gf1, ga1, sc1, ev1 }, { gf2, ga2, sc2, ev2 }, end2, ms, resume,
  );

  if (c2.sub.k !== 'pens') return c2; // resultado directo

  // ── tanda interactiva: un penal por turno, alternando desde `first` ──
  const sub = c2.sub;
  const you: PenKickResult[] = [];
  const oppArr: OppPenResult[] = [];
  let winner: 'you' | 'opp' | undefined;
  let guard = 0;
  while (!winner) {
    if (guard++ > 200) return { error: 'tanda_no_converge' };
    const aim = log.shoot[cur.shoot++];
    if (!aim) return { error: 'shoot_corto' };
    const turn = pensTurn(sub.first, you.length, oppArr.length);
    if (turn === 'you') you.push(penKick(ms, you.length, aim, xiAvg, ov));
    else oppArr.push(oppPenShot(ms, oppArr.length, aim, xiAvg, ov));
    winner = shootoutWinner(you.map((k) => k.scored), oppArr.map((k) => k.scored)) ?? undefined;
  }

  const m: MatchView = {
    oppId: c.oppId, oppName: opp.name, oppEdition: opp.edition,
    gf: sub.gf, ga: sub.ga, scorers: sub.scorers, ev: sub.ev,
    pens: { you: you.filter((k) => k.scored).length, opp: oppArr.filter((k) => k.scored).length },
    outcome: winner === 'you' ? 'W' : 'L',
    end2: sub.end2,
    leg: isTwoLegged(stage) ? c.leg : undefined,
    agg: sub.agg,
  };
  return { ...c2, ...settleMatch(c2, stage, m) };
}

/* ── Avanzar de partido: replica NEXT ──
   Serie abierta (ida de una eliminatoria) → vuelta contra el mismo rival.
   Si no, siguiente etapa con rival sorteado del pool vivo. */
function advance(c: Campaign, seed: number): Campaign {
  if (isTwoLegged(LADDER[c.stageIdx]) && c.sub.k === 'fulltime' && c.sub.m.leg === 1) {
    return { ...c, sub: { k: 'preview' } };
  }
  const nextIdx = c.stageIdx + 1;
  const ms = matchSeedFor(seed, nextIdx);
  const candidates = c.pool.filter((id) => id !== c.oppId);
  const oppId = pickOpponent(ms, candidates.length ? candidates : c.pool, TEAMS, nextIdx);
  return { ...c, stageIdx: nextIdx, oppId, leg: 1, agg1: undefined, sub: { k: 'preview' } };
}

/* ── Reproducir una corrida completa ── */
export function playRun(log: RunLog): RunResult {
  const fail = (error: string, xi: Player[] = []): RunResult => ({
    ok: false, error, champion: false, stage: 'g1', matches: [],
    stats: { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0 }, xi, xiAvg: 0,
  });

  if (log.v !== RUN_VERSION) return fail('version_incompatible');
  if (!(log.formation in FORMATIONS)) return fail('formacion_invalida');

  const cur: Cursors = { draft: 0, att: 0, pen: 0, shoot: 0 };

  const drafted = replayDraft(log, cur);
  if ('error' in drafted) return fail(drafted.error);
  const xi = lineupXI(drafted.lineup);
  const xiAvg = Math.round(avg(xi));

  // arranque (replica ENTER)
  const pool = TEAMS.map((t) => t.id);
  const oppId0 = pickOpponent(matchSeedFor(log.seed, 0), pool, TEAMS, 0);
  let c: Campaign = {
    xi, stageIdx: 0, oppId: oppId0, pool, groupPts: 0,
    stats: emptyStats(), sub: { k: 'preview' }, leg: 1,
  };

  const matches: MatchView[] = [];
  let guard = 0;
  while (true) {
    if (guard++ > 30) return fail('corrida_no_converge', xi); // 9 partidos como mucho
    const r = playMatch(c, log, cur);
    if ('error' in r) return fail(r.error, xi);
    c = r;
    if (c.sub.k === 'fulltime') matches.push(c.sub.m);
    if (c.done) break;
    c = advance(c, log.seed);
  }

  return {
    ok: true,
    champion: c.done!.champion,
    stage: c.done!.stage,
    matches,
    stats: {
      pj: c.stats.pj, w: c.stats.w, d: c.stats.d, l: c.stats.l,
      gf: c.stats.gf, ga: c.stats.ga, cs: c.stats.cs,
    },
    xi,
    xiAvg,
  };
}