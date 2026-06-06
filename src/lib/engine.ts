/* ══════════════════════════════════════════
   ENGINE — engine.ts

   Pure functions, zero React, zero DOM. Everything is deterministic
   from a seed, which is what makes matches reproducible and shareable.
══════════════════════════════════════════ */

import {
  type Player,
  type Pos,
  type Team,
  type FormationName,
  TEAMS,
  FORMATIONS,
} from '../data/players';

/* ── Deterministic PRNG (mulberry32) ── same seed → same sequence. */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* FNV-1a: turn any string (a date, a share code) into a stable seed. */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* Everyone who plays on the same day gets the same roll (Wordle-style). */
export function dailySeed(date = new Date()): number {
  return hashSeed(date.toISOString().slice(0, 10));
}

/* ── Roll: pick which champion team is offered. ── */
export function rollTeam(rng: () => number, teams: Team[] = TEAMS): Team {
  return teams[Math.floor(rng() * teams.length)];
}

/* ════════════════════════════════════════════════
   LINEUP — the XI as positioned slots
   A lineup is one cell per formation slot, in slot order.
   `null` = still open. This is what the pitch board renders.
═══════════════════════════════════════════════════ */
export type Lineup = (Player | null)[];

export function emptyLineup(formation: FormationName): Lineup {
  return FORMATIONS[formation].slots.map(() => null);
}

/* A player fits a slot if the slot's position is one of the player's.
   No penalty: it fits or it doesn't (7a0-style). */
export function fitsSlot(player: Player, slotPos: Pos): boolean {
  return player.pos.includes(slotPos);
}

/* First open slot this player can fill, or -1 if none. Picking always
   drops the player into the earliest matching gap. */
export function firstOpenSlotFor(
  player: Player,
  lineup: Lineup,
  formation: FormationName,
): number {
  const slots = FORMATIONS[formation].slots;
  for (let i = 0; i < slots.length; i++) {
    if (lineup[i] === null && fitsSlot(player, slots[i].pos)) return i;
  }
  return -1;
}

/* All open slots this player could fill (for "choose a position"). */
export function openSlotsFor(
  player: Player,
  lineup: Lineup,
  formation: FormationName,
): number[] {
  const slots = FORMATIONS[formation].slots;
  const out: number[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (lineup[i] === null && fitsSlot(player, slots[i].pos)) out.push(i);
  }
  return out;
}

export function lineupFilled(lineup: Lineup): boolean {
  return lineup.every((cell) => cell !== null);
}

/* The XI as a flat array (for the simulation), skipping any gaps. */
export function lineupXI(lineup: Lineup): Player[] {
  return lineup.filter((cell): cell is Player => cell !== null);
}

/* ── Draft: which champion is offered at a given step (pure). ──
   Repeats allowed across the draft, but never two in a row. */
export function draftTeamAt(
  seed: number,
  step: number,
  teams: Team[] = TEAMS,
): Team {
  const rng = mulberry32(seed);
  let team = rollTeam(rng, teams);
  for (let k = 0; k < step; k++) {
    let next = rollTeam(rng, teams);
    while (teams.length > 1 && next.id === team.id) next = rollTeam(rng, teams);
    team = next;
  }
  return team;
}

/* ════════════════════════════════════════════════
   SIMULATE — deterministic scoreline from the seed + your XI
═══════════════════════════════════════════════════ */
export interface MatchResult {
  gf: number;
  ga: number;
  power: number;
  isPerfect: boolean; // the 7–0 jackpot
}

const clampGoals = (n: number) => Math.max(0, Math.min(9, Math.round(n)));

export function simulate(picks: Player[], rng: () => number): MatchResult {
  const avg = picks.reduce((sum, p) => sum + p.r, 0) / picks.length;
  const power = avg + (rng() - 0.5) * 12;        // seeded variance
  const opponent = 68 + rng() * 8;               // fixed wall + noise
  const margin = power - opponent;
  const gf = clampGoals(margin / 4 + rng() * 2.5);
  const ga = clampGoals(-margin / 12 + rng() * 1.3);
  return { gf, ga, power: Math.round(power), isPerfect: gf >= 7 && ga === 0 };
}

/* ── Scorers ── weighted by attacking line × rating, same rng. */
export interface Scorer {
  i: number;
  n: string;
}

// Map a fine position to its coarse line, to weight scoring chance.
function lineOf(pos: Pos): 'GK' | 'DF' | 'MF' | 'FW' {
  if (pos === 'GK') return 'GK';
  if (pos === 'RB' || pos === 'CB' || pos === 'LB') return 'DF';
  if (pos === 'RW' || pos === 'LW' || pos === 'ST') return 'FW';
  return 'MF';
}

const ATTACK_WEIGHT: Record<'GK' | 'DF' | 'MF' | 'FW', number> = {
  FW: 3,
  MF: 1.5,
  DF: 0.5,
  GK: 0.05,
};

export function pickScorers(
  goals: number,
  picks: Player[],
  rng: () => number,
): Scorer[] {
  if (goals <= 0) return [];

  // Weight by the player's NATURAL position (pos[0]) × rating.
  const weighted = picks.map((p) => ({ p, w: ATTACK_WEIGHT[lineOf(p.pos[0])] * p.r }));
  const total = weighted.reduce((sum, x) => sum + x.w, 0);

  const scorers: Scorer[] = [];
  for (let g = 0; g < goals; g++) {
    let ticket = rng() * total;
    let chosen = weighted[weighted.length - 1].p; // float-drift fallback
    for (const { p, w } of weighted) {
      ticket -= w;
      if (ticket <= 0) {
        chosen = p;
        break;
      }
    }
    scorers.push({ i: chosen.i, n: chosen.n });
  }
  return scorers;
}

/* ── Match ── reproducible from the seed + your XI alone. */
export function resolveMatch(
  seed: number,
  xi: Player[],
): { result: MatchResult; scorers: Scorer[] } {
  const rng = mulberry32(seed);
  const result = simulate(xi, rng);
  const scorers = pickScorers(result.gf, xi, rng);
  return { result, scorers };
}