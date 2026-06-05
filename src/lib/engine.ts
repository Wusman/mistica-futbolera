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

/* ──────────────────────────────────────────────────────────────
   REPLACE the block you appended last time with THIS one,
   at the end of src/lib/engine.ts.
   Uses only symbols already in scope there:
     Player, Team, MatchResult, TEAMS, mulberry32, rollTeam, simulate
────────────────────────────────────────────────────────────── */

/* ── Scorers ─────────────────────────────────────────────────
   Who scored your goals. Weighted by role × rating (FW > MF > DF,
   GK almost never), drawn from the SAME rng as the scoreline. */
export interface Scorer {
  i: number; // player id
  n: string; // player name
}

// Base likelihood per position, before rating. Player['p'] is the Pos
// union, so no extra import is needed (same trick as validateXI).
const ATTACK_WEIGHT: Record<Player['p'], number> = {
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

  const weighted = picks.map((p) => ({ p, w: ATTACK_WEIGHT[p.p] * p.r }));
  const total = weighted.reduce((sum, x) => sum + x.w, 0);

  const scorers: Scorer[] = [];
  for (let g = 0; g < goals; g++) {
    let ticket = rng() * total; // weighted roulette spin
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

/* ── Draft ───────────────────────────────────────────────────
   Which champion is OFFERED at a given draft step. Derived purely
   from the seed, so the whole sequence of draws is reproducible.
   Repeats are allowed across the draft (we only have a few clubs),
   but never two in a row, so the pool feels alive. */
export function draftTeamAt(
  seed: number,
  step: number,
  teams: Team[] = TEAMS,
): Team {
  const rng = mulberry32(seed);
  let team = rollTeam(rng, teams);
  for (let k = 0; k < step; k++) {
    let next = rollTeam(rng, teams);
    // skip an immediate repeat (terminates fast with >1 team)
    while (teams.length > 1 && next.id === team.id) next = rollTeam(rng, teams);
    team = next;
  }
  return team;
}

/* ── Match ───────────────────────────────────────────────────
   Reproducible from the seed + your final XI alone — independent
   of how the draft got there. A share code = seed + picked ids. */
export function resolveMatch(
  seed: number,
  xi: Player[],
): { result: MatchResult; scorers: Scorer[] } {
  const rng = mulberry32(seed);
  const result = simulate(xi, rng);
  const scorers = pickScorers(result.gf, xi, rng);
  return { result, scorers };
}