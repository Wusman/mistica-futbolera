/* ══════════════════════════════════════════
   run.ts — la corrida como función PURA (fundación del share-code).

   runWith(seed, formation, driver) reproduce una corrida completa fuera de
   React. El DRIVER es la fuente de las decisiones del jugador; inyectándolo,
   la MISMA máquina de reproducción sirve para tres cosas sin duplicarse:
     · playRun(log)  → driver que lee las decisiones de un RunLog.
     · encodeRun     → driver que lee del log y ESCRIBE bits (sharecode.ts).
     · decodeRun     → driver que LEE bits y reconstruye el log (sharecode.ts).

   Determinista: mismas entradas → mismo RunResult, siempre. Sin React, sin
   DOM, sin reloj, sin red. Todo el azar sale de la semilla vía engine.ts.
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
                solos y no ocupan lugar). pick.player = id global `i`.
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

/* v2 (ene 2026): rebalance del motor (STAGE_RAMP + ATT). Los share-codes v1
   reproducirían resultados DISTINTOS a los originales bajo el motor nuevo,
   así que el bump los rechaza limpio (version_incompatible) en vez de
   dejarlos mentir. */
export const RUN_VERSION = 2;

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

/* ── Driver: fuente de decisiones inyectable ──
   runWith le pide cada decisión en el punto exacto en que ocurre, con el
   contexto que hace falta (los elegibles y sus slots, si se puede pasar). Un
   driver puede leerlas de un log, de un bitstream, etc. Devolver undefined
   aborta la reproducción (log/stream corto). */
export interface RunDriver {
  draft(eligible: Player[], slotsFor: (p: Player) => number[], canPass: boolean): DraftMove | undefined;
  attitude(): Attitude | undefined;
  penAim(): PenAim | undefined;
  shoot(): PenAim | undefined;
}

/* Error interno de reproducción: runWith lo captura y lo vuelve RunResult.ok=false.
   El codec también puede lanzarlo para abortar limpio. */
export class RunError extends Error {}

const teamById = (id: string) => TEAMS.find((t) => t.id === id)!;

/* ── Aplicar un penal EN JUGADA (1T o 2T): replica HALF_PEN / H2_PEN ── */
function applyInPlayPen(
  ms: number, idxStream: number, side: 'you' | 'opp', min: number, aim: PenAim,
  xiAvg: number, ov: number,
  gf: number, ga: number, sc: Scorer[], ev: TickerEvent[],
): { gf: number; ga: number; sc: Scorer[]; ev: TickerEvent[] } {
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
  return { gf, ga, sc, ev };
}

/* ── Jugar un partido completo: preview → fulltime (con tanda si toca) ── */
function playMatch(c: Campaign, seed: number, driver: RunDriver): Campaign {
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
  const pen1 = halfPenalty(ms, 1, ev1);
  if (pen1) {
    const aim = driver.penAim();
    if (!aim) throw new RunError('penAims_corto_1t');
    const r = applyInPlayPen(ms, 97, pen1.side, pen1.min, aim, xiAvg, ov, gf1, ga1, sc1, ev1);
    gf1 = r.gf; ga1 = r.ga; sc1 = r.sc; ev1 = r.ev;
  }

  // ── decisión de entretiempo → 2do tiempo ──
  const attitude = driver.attitude();
  if (!attitude) throw new RunError('attitudes_corto');
  const h2 = playHalf(ms, 2, c.xi, ov, attitude);
  let gf2 = h2.gf, ga2 = h2.ga;
  let sc2 = h2.scorers;
  let ev2 = halfEvents(ms, 2, h2, bestXI(opp));
  const end2 = 90 + addedTime(ms, 2);
  let resume: number | undefined;
  const pen2 = halfPenalty(ms, 2, ev2);
  if (pen2) {
    const aim = driver.penAim();
    if (!aim) throw new RunError('penAims_corto_2t');
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
    if (guard++ > 200) throw new RunError('tanda_no_converge');
    const aim = driver.shoot();
    if (!aim) throw new RunError('shoot_corto');
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

/* ── Avanzar de partido: replica NEXT ── */
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

/* ── Reproducir una corrida entera pidiendo cada decisión al driver ── */
export function runWith(seed: number, formation: FormationName, driver: RunDriver): RunResult {
  const fail = (error: string, xi: Player[] = []): RunResult => ({
    ok: false, error, champion: false, stage: 'g1', matches: [],
    stats: { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0 }, xi, xiAvg: 0,
  });

  if (!(formation in FORMATIONS)) return fail('formacion_invalida');

  let xi: Player[] = [];
  try {
    // ── draft ──
    const lineup: Lineup = emptyLineup(formation);
    let passes = STARTING_PASSES;
    let step = 0;
    let guard = 0;
    while (!lineupFilled(lineup)) {
      if (guard++ > 5000) throw new RunError('draft_no_converge');
      const team = draftTeamAt(seed, step);
      const taken = new Set(lineup.filter((c): c is Player => c !== null).map((p) => p.i));
      const eligible = team.players.filter(
        (p) => !taken.has(p.i) && openSlotsFor(p, lineup, formation).length > 0,
      );
      if (eligible.length === 0) { step++; continue; } // salto forzado

      const slotsFor = (p: Player) => openSlotsFor(p, lineup, formation);
      const mv = driver.draft(eligible, slotsFor, passes > 0);
      if (!mv) throw new RunError('draft_corto');
      if ('pass' in mv) {
        if (passes <= 0) throw new RunError('pass_sin_saldo');
        passes--; step++; continue;
      }
      const player = eligible.find((p) => p.i === mv.pick.player);
      if (!player) throw new RunError('pick_no_elegible');
      if (!slotsFor(player).includes(mv.pick.slot)) throw new RunError('slot_invalido');
      lineup[mv.pick.slot] = player;
      step++;
    }
    xi = lineupXI(lineup);

    // ── arranque (replica ENTER) ──
    const pool = TEAMS.map((t) => t.id);
    const oppId0 = pickOpponent(matchSeedFor(seed, 0), pool, TEAMS, 0);
    let c: Campaign = {
      xi, stageIdx: 0, oppId: oppId0, pool, groupPts: 0,
      stats: emptyStats(), sub: { k: 'preview' }, leg: 1,
    };

    // ── partidos ──
    const matches: MatchView[] = [];
    let mguard = 0;
    while (true) {
      if (mguard++ > 30) throw new RunError('corrida_no_converge');
      c = playMatch(c, seed, driver);
      if (c.sub.k === 'fulltime') matches.push(c.sub.m);
      if (c.done) break;
      c = advance(c, seed);
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
      xiAvg: Math.round(avg(xi)),
    };
  } catch (e) {
    return fail(e instanceof RunError ? e.message : 'error_desconocido', xi);
  }
}

/* ── playRun: driver que lee las decisiones de un RunLog ── */
export function playRun(log: RunLog): RunResult {
  if (log.v !== RUN_VERSION) {
    return {
      ok: false, error: 'version_incompatible', champion: false, stage: 'g1',
      matches: [], stats: { pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0 }, xi: [], xiAvg: 0,
    };
  }
  const cur = { d: 0, a: 0, p: 0, s: 0 };
  const driver: RunDriver = {
    draft: () => log.draft[cur.d++],
    attitude: () => log.attitudes[cur.a++],
    penAim: () => log.penAims[cur.p++],
    shoot: () => log.shoot[cur.s++],
  };
  return runWith(log.seed, log.formation, driver);
}