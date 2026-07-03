import { type Player } from '../data/players';
import { type Scorer, type Shootout, type TickerEvent, type PenKickResult, type OppPenResult, type PenAim, penCoinToss } from './engine';

/* ── Tournament ladder ── */
export type Stage = 'g1' | 'g2' | 'r16' | 'qf' | 'sf' | 'final';

export const LADDER: Stage[] = ['g1', 'g2', 'r16', 'qf', 'sf', 'final'];

export const STAGE_LABEL: Record<Stage, string> = {
  g1: 'Grupo · Fecha 1',
  g2: 'Grupo · Fecha 2',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  final: 'Final',
};

export const isGroup = (s: Stage) => s === 'g1' || s === 'g2';

/* Eliminatorias a doble partido (la final es única). Sin gol de visitante:
   manda el global; si empata tras la vuelta, tanda. */
export const isTwoLegged = (s: Stage) => s === 'r16' || s === 'qf' || s === 'sf';

/* Etapa de cada partido de una corrida, en orden. Recorre el LADDER en
   paralelo a los partidos: las eliminatorias a ida y vuelta consumen dos
   partidos (la ida no cierra la serie), grupo y final uno. Deriva solo de
   `leg`, así que es determinista. Lo usa el modo espectador para rotular el
   camino sin tener que guardar la etapa en cada MatchView. */
export function stagesFor(matches: { leg?: 1 | 2 }[]): Stage[] {
  const out: Stage[] = [];
  let li = 0;
  for (const m of matches) {
    const st = LADDER[Math.min(li, LADDER.length - 1)];
    out.push(st);
    if (isTwoLegged(st)) { if (m.leg === 2) li++; } else li++;
  }
  return out;
}

/* ── Running stats across a run ── */
export interface Stats {
  pj: number; w: number; d: number; l: number;
  gf: number; ga: number; cs: number;
  goals: Record<string, number>; // your scorers across the run
}

export const emptyStats = (): Stats => ({ pj: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, cs: 0, goals: {} });

/* ── A finished match (for the full-time view) ── */
export interface MatchView {
  oppId: string; oppName: string; oppEdition: string;
  gf: number; ga: number; scorers: Scorer[];
  ev: TickerEvent[];   // goles con minuto (relato); derivado del matchSeed
  pens?: Shootout;
  outcome: 'W' | 'D' | 'L';
  end2: number; // 90 + descuento (reloj del relato)
  leg?: 1 | 2;                       // solo eliminatorias con vuelta
  agg?: { gf: number; ga: number };  // global acumulado tras este partido
}

/* ── The interactive sub-state of the current match ── */
export type Sub =
  | { k: 'preview' }
  | {
      /* 1er tiempo jugado. pen1 = penal en jugada (si lo hay): uno de los
         goles ya decididos se convierte en penal interactivo; al resolverse
         (HALF_PEN) gf1/ga1/sc1/ev1 quedan AJUSTADOS (si falló, el gol no va). */
      k: 'half'; gf1: number; ga1: number; sc1: Scorer[]; ev1: TickerEvent[];
      end1: number; // 45 + descuento
      pen1?: { min: number; side: 'you' | 'opp'; res?: { aim: PenAim; dive: PenAim; scored: boolean } };
    }
  | {
      /* Penal en jugada del 2do tiempo: el partido NO se liquida hasta
         resolverlo (H2_PEN ajusta gf2/ga2/sc2/ev2; H2_DONE liquida con
         resume = pen.min para que el relato retome desde ahí). */
      k: 'h2pen';
      gf1: number; ga1: number; sc1: Scorer[]; ev1: TickerEvent[];
      gf2: number; ga2: number; sc2: Scorer[]; ev2: TickerEvent[];
      end2: number; // 90 + descuento
      pen: { min: number; side: 'you' | 'opp'; res?: { aim: PenAim; dive: PenAim; scored: boolean } };
    }
  | {
      /* Tanda interactiva v2: el partido (gf/ga/ev) quedó congelado en el 90'
         y se define a un penal por turno, alternando estricto desde `first`
         (sorteo determinista). En tu turno pateás (KICK); en el rival, TU
         arquero elige palo (DIVE). winner se setea al decidirse; PENS_DONE
         la "liquida" hacia fulltime (stats, pool, done). */
      k: 'pens';
      gf: number; ga: number; scorers: Scorer[]; ev: TickerEvent[];
      agg?: { gf: number; ga: number }; // global de la serie (tanda tras la vuelta)
      end2: number; resume?: number; // relato del 2T: hasta 90+X, desde resume si hubo penal
      first: 'you' | 'opp';
      you: PenKickResult[]; opp: OppPenResult[];
      winner?: 'you' | 'opp';
    }
  | { k: 'fulltime'; m: MatchView; resume?: number };

/* ── The whole run ── */
export interface Campaign {
  xi: Player[];
  stageIdx: number;
  oppId: string;
  pool: string[];      // surviving champion ids (still yours to face)
  groupPts: number;
  stats: Stats;
  sub: Sub;
  /* Ida y vuelta: leg 1|2 (siempre 1 en grupos y final); agg1 = marcador de
     la ida mientras la serie está abierta. */
  leg: 1 | 2;
  agg1?: { gf: number; ga: number };
  done?: { champion: boolean; stage: Stage };
}
/* ══════════════════════════════════════════
   Orquestación pura del torneo (extraída del reducer en junio 2026 para que
   una corrida pueda reproducirse fuera de React: modo espectador y
   verificación del share-code en el Worker la usan tal cual). Sin React, sin
   DOM, sin reloj: misma entrada → misma salida.
══════════════════════════════════════════ */

/* Semilla de un partido: deriva de la semilla de la corrida + la etapa + la
   vuelta (LEG2 xor). Determinista. */
export const matchSeedFor = (seed: number, stageIdx: number, leg: 1 | 2 = 1) =>
  (seed ^ ((stageIdx + 1) * 0x85ebca6b) ^ (leg === 2 ? 0x4c454732 : 0)) >>> 0; // ^"LEG2"

/* Liquidar un partido decidido: stats, pool vivo, puntos de grupo y done.
   Lo usan el cierre del 2do tiempo (resultados directos) y el de la tanda. */
export function settleMatch(
  c: Campaign,
  stage: Stage,
  m: MatchView,
): Pick<Campaign, 'pool' | 'groupPts' | 'stats' | 'sub' | 'done' | 'leg' | 'agg1'> {
  const goals = { ...c.stats.goals };
  for (const s of m.scorers) goals[s.n] = (goals[s.n] ?? 0) + 1;
  const stats: Stats = {
    pj: c.stats.pj + 1,
    w: c.stats.w + (m.outcome === 'W' ? 1 : 0),
    d: c.stats.d + (m.outcome === 'D' ? 1 : 0),
    l: c.stats.l + (m.outcome === 'L' ? 1 : 0),
    gf: c.stats.gf + m.gf,
    ga: c.stats.ga + m.ga,
    cs: c.stats.cs + (m.ga === 0 ? 1 : 0),
    goals,
  };

  const twoLeg = isTwoLegged(stage);
  const legOpen = twoLeg && c.leg === 1; // la ida deja la serie abierta

  /* ¿La llave quedó ganada? Series por global (o tanda); final/grupo por
     el partido. La ida nunca decide. */
  const tieWon = legOpen
    ? false
    : twoLeg
      ? (m.pens ? m.outcome === 'W' : (m.agg?.gf ?? m.gf) > (m.agg?.ga ?? m.ga))
      : m.outcome === 'W';

  const pool = tieWon ? c.pool.filter((id) => id !== c.oppId) : c.pool;
  const groupPts = c.groupPts + (isGroup(stage) ? (m.outcome === 'W' ? 3 : m.outcome === 'D' ? 1 : 0) : 0);

  let done: Campaign['done'];
  if (stage === 'g2') {
    if (groupPts < 3) done = { champion: false, stage };
  } else if (!isGroup(stage) && !legOpen) {
    if (!tieWon) done = { champion: false, stage };
    else if (stage === 'final') done = { champion: true, stage };
  }

  return {
    pool, groupPts, stats, sub: { k: 'fulltime', m }, done,
    leg: legOpen ? 2 : c.leg,
    agg1: legOpen ? { gf: m.gf, ga: m.ga } : c.agg1,
  };
}

/* Cierre del 2do tiempo: combina mitades, recorta al tope de 9, deriva a
   tanda si hay empate eliminatorio (global, en ida y vuelta) y liquida.
   `resume` (minuto del penal en jugada) hace que el relato retome desde ahí.
   Devuelve el nuevo Campaign (el shell lo envuelve en su fase). */
export function settleH2(
  c: Campaign,
  stage: Stage,
  oppName: string,
  oppEdition: string,
  h1: { gf1: number; ga1: number; sc1: Scorer[]; ev1: TickerEvent[] },
  h2: { gf2: number; ga2: number; sc2: Scorer[]; ev2: TickerEvent[] },
  end2: number,
  ms: number,
  resume?: number,
): Campaign {
  const gf = Math.min(9, h1.gf1 + h2.gf2);
  const ga = Math.min(9, h1.ga1 + h2.ga2);
  const scorers = [...h1.sc1, ...h2.sc2];

  /* Si el tope de 9 recortó goles, recortamos eventos para que coincidan. */
  let cy = 0, co = 0;
  const ev = [...h1.ev1, ...h2.ev2].filter((e) =>
    e.side === 'you' ? ++cy <= gf : ++co <= ga,
  );

  /* Ida y vuelta: el global manda. La ida nunca elimina ni va a tanda;
     la vuelta empatada EN EL GLOBAL deriva a penales. La final es única. */
  const twoLeg = isTwoLegged(stage);
  const aggGf = gf + (twoLeg && c.leg === 2 ? c.agg1?.gf ?? 0 : 0);
  const aggGa = ga + (twoLeg && c.leg === 2 ? c.agg1?.ga ?? 0 : 0);
  const needsPens = !isGroup(stage) && (twoLeg ? c.leg === 2 && aggGf === aggGa : gf === ga);

  if (needsPens) {
    const sub: Sub = {
      k: 'pens', gf, ga, scorers, ev, end2, resume,
      agg: twoLeg ? { gf: aggGf, ga: aggGa } : undefined,
      first: penCoinToss(ms), you: [], opp: [],
    };
    return { ...c, sub };
  }

  const outcome: 'W' | 'D' | 'L' = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
  const m: MatchView = {
    oppId: c.oppId, oppName, oppEdition, gf, ga, scorers, ev, outcome, end2,
    leg: twoLeg ? c.leg : undefined,
    agg: twoLeg ? { gf: aggGf, ga: aggGa } : undefined,
  };
  const settled: Campaign = { ...c, ...settleMatch(c, stage, m) };
  if (settled.sub.k === 'fulltime' && resume !== undefined) {
    settled.sub = { ...settled.sub, resume };
  }
  return settled;
}