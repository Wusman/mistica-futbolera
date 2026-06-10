import { type Player } from '../data/players';
import { type Scorer, type Shootout, type TickerEvent } from './engine';

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
}

/* ── The interactive sub-state of the current match ── */
export type Sub =
  | { k: 'preview' }
  | { k: 'half'; gf1: number; ga1: number; sc1: Scorer[]; ev1: TickerEvent[] }
  | { k: 'fulltime'; m: MatchView };

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