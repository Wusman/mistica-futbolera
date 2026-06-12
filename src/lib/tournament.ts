import { type Player } from '../data/players';
import { type Scorer, type Shootout, type TickerEvent, type PenKickResult, type OppPenResult, type PenAim } from './engine';

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
  done?: { champion: boolean; stage: Stage };
}