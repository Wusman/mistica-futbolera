/* ══════════════════════════════════════════
   ENGINE — engine.ts
   Pure, deterministic from a seed. Zero React, zero DOM.
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

export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailySeed(date = new Date()): number {
  return hashSeed(date.toISOString().slice(0, 10));
}

export function rollTeam(rng: () => number, teams: Team[] = TEAMS): Team {
  return teams[Math.floor(rng() * teams.length)];
}

/* ════════ LINEUP — the XI as positioned slots ════════ */
export type Lineup = (Player | null)[];

export function emptyLineup(formation: FormationName): Lineup {
  return FORMATIONS[formation].slots.map(() => null);
}

export function fitsSlot(player: Player, slotPos: Pos): boolean {
  return player.pos.includes(slotPos);
}

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

export function lineupXI(lineup: Lineup): Player[] {
  return lineup.filter((cell): cell is Player => cell !== null);
}

/* ── Draft: which champion is offered at a step (pure). ── */
export function draftTeamAt(seed: number, step: number, teams: Team[] = TEAMS): Team {
  const rng = mulberry32(seed);
  let team = rollTeam(rng, teams);
  for (let k = 0; k < step; k++) {
    let next = rollTeam(rng, teams);
    while (teams.length > 1 && next.id === team.id) next = rollTeam(rng, teams);
    team = next;
  }
  return team;
}

/* ════════ SIMULATE — your XI vs a named champion rival ════════ */
export interface MatchResult {
  gf: number;
  ga: number;
  power: number;
  isPerfect: boolean;
  opp: string; // the named rival (for the card)
}

const clampGoals = (n: number) => Math.max(0, Math.min(9, Math.round(n)));
const avg = (ps: Player[]) => ps.reduce((s, p) => s + p.r, 0) / ps.length;

export function simulate(picks: Player[], opp: Team, rng: () => number): MatchResult {
  // Opponent strength = its best 11 by rating.
  const oppXI = [...opp.players].sort((a, b) => b.r - a.r).slice(0, 11);

  const yourPow = avg(picks) + (rng() - 0.5) * 10;
  const oppPow = avg(oppXI) + (rng() - 0.5) * 10;
  const margin = yourPow - oppPow;

  // Base of ~1.5 so games aren't goalless; margin tilts it; rng gives life.
  const gf = clampGoals(1.5 + margin / 5 + rng() * 2.6);
  const ga = clampGoals(1.3 - margin / 7 + rng() * 1.7);

  return {
    gf,
    ga,
    power: Math.round(yourPow),
    isPerfect: gf >= 7 && ga === 0,
    opp: `${opp.name} · ${opp.edition}`,
  };
}

/* ── Scorers ── weighted by attacking line × rating, same rng. ── */
export interface Scorer {
  i: number;
  n: string;
}

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

  const weighted = picks.map((p) => ({ p, w: ATTACK_WEIGHT[lineOf(p.pos[0])] * p.r }));
  const total = weighted.reduce((sum, x) => sum + x.w, 0);

  const scorers: Scorer[] = [];
  for (let g = 0; g < goals; g++) {
    let ticket = rng() * total;
    let chosen = weighted[weighted.length - 1].p;
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

/* ── Match ── reproducible from the seed + your XI alone. ── */
export function resolveMatch(
  seed: number,
  xi: Player[],
): { result: MatchResult; scorers: Scorer[] } {
  const rng = mulberry32(seed);
  const opp = rollTeam(rng); // the rival, drawn from the seed
  const result = simulate(xi, opp, rng);
  const scorers = pickScorers(result.gf, xi, rng);
  return { result, scorers };
}