import { type Pos } from './data/players';

/* UI-only Spanish labels for the fine positions. The engine and data
   keep the canonical codes (GK, RB, ...); this is just what the player sees. */
export const POS_LABEL: Record<Pos, string> = {
  GK: 'ARQ',
  RB: 'LD',
  CB: 'DFC',
  LB: 'LI',
  DM: 'MCD',
  CM: 'MC',
  AM: 'MCO',
  RM: 'MD',
  LM: 'MI',
  RW: 'ED',
  LW: 'EI',
  ST: 'DC',
};