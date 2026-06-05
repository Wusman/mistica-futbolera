/* ══════════════════════════════════════════
   ENGINE — engine.ts

   The heart of the game. Pure functions, zero React, zero DOM.
   Everything is deterministic from a seed, which is what makes
   matches reproducible and shareable.
══════════════════════════════════════════ */

import {
  type Player,
  type Team,
  type FormationName,
  TEAMS,
  FORMATIONS,
} from '../data/players';

/* ── Deterministic PRNG ──────────────────────────────────────
   mulberry32: tiny, fast, 32-bit seeded generator.
   Same seed → same sequence of numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Turn any string (a date, a share code) into a stable 32-bit seed.
   FNV-1a hash — small and good enough for game randomness. */
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
  return hashSeed(date.toISOString().slice(0, 10)); // "2026-06-05"
}

/* ── Step 1: ROLL ────────────────────────────────────────────
   From the seed, pick which champion team the player must build from. */
export function rollTeam(rng: () => number, teams: Team[] = TEAMS): Team {
  return teams[Math.floor(rng() * teams.length)];
}

/* ── Build validation ────────────────────────────────────────
   The chosen XI must match the formation's position counts exactly. */
export function validateXI(picks: Player[], formation: FormationName): boolean {
  const need = FORMATIONS[formation];
  const have: Record<Player['p'], number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
  for (const p of picks) have[p.p]++;
  return (Object.keys(need) as Player['p'][]).every((k) => have[k] === need[k]);
}

/* ── Step 3: SIMULATE ────────────────────────────────────────
   Deterministic given the same rng (same seed). Returns the scoreline. */
export interface MatchResult {
  gf: number; // goals for
  ga: number; // goals against
  power: number; // your XI's computed strength (handy for the share card)
  isPerfect: boolean; // the 7–0 jackpot
}

const clampGoals = (n: number) => Math.max(0, Math.min(9, Math.round(n)));

export function simulate(picks: Player[], rng: () => number): MatchResult {
  // 1. Base strength = average rating of your XI.
  const avg = picks.reduce((sum, p) => sum + p.r, 0) / picks.length;

  // 2. Seeded variance: exciting, but reproducible from the seed.
  const power = avg + (rng() - 0.5) * 12;

  // 3. The opponent is a fixed wall with a little noise.
  const opponent = 68 + rng() * 8;
  const margin = power - opponent;

  // 4. Map the margin to a scoreline.
  //    A strong XI + a kind roll can reach 7–0; it should stay rare.
  const gf = clampGoals(margin / 4 + rng() * 2.5);
  const ga = clampGoals(-margin / 12 + rng() * 1.3);

  return {
    gf,
    ga,
    power: Math.round(power),
    isPerfect: gf >= 7 && ga === 0,
  };
}
