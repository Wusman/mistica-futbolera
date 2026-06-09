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

export const avg = (ps: Player[]) => ps.reduce((s, p) => s + p.r, 0) / ps.length;

/* ════════ LINEUP — the XI as positioned slots ════════ */
export type Lineup = (Player | null)[];

export function emptyLineup(formation: FormationName): Lineup {
  return FORMATIONS[formation].slots.map(() => null);
}
export function fitsSlot(player: Player, slotPos: Pos): boolean {
  return player.pos.includes(slotPos);
}
export function firstOpenSlotFor(player: Player, lineup: Lineup, formation: FormationName): number {
  const slots = FORMATIONS[formation].slots;
  for (let i = 0; i < slots.length; i++) if (lineup[i] === null && fitsSlot(player, slots[i].pos)) return i;
  return -1;
}
export function openSlotsFor(player: Player, lineup: Lineup, formation: FormationName): number[] {
  const slots = FORMATIONS[formation].slots;
  const out: number[] = [];
  for (let i = 0; i < slots.length; i++) if (lineup[i] === null && fitsSlot(player, slots[i].pos)) out.push(i);
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

/* ── Showcase XI (HOME) — pure eye-candy, deterministic from the seed. ──
   Fills a formation with big names from the dataset so the home shows the
   carrot ("look what you could draft") instead of an empty board. For each
   slot it picks among the top-rated eligible players, seeded by the seed,
   so every seed shows a slightly different dream XI. Presentation-only:
   it does NOT touch the draft, the campaign, or the share-code. */
export function showcaseXI(
  seed: number,
  formation: FormationName,
  teams: Team[] = TEAMS,
): (Player | null)[] {
  const rng = mulberry32((seed ^ 0x53484f57) >>> 0); // ^ "SHOW"
  const all = teams.flatMap((t) => t.players);
  const usedIds = new Set<number>();
  const usedNames = new Set<string>(); // avoid two Messis (bar11 + bar15)
  return FORMATIONS[formation].slots.map((slot) => {
    const cands = all
      .filter((p) => p.pos.includes(slot.pos) && !usedIds.has(p.i) && !usedNames.has(p.n))
      .sort((a, b) => b.r - a.r)
      .slice(0, 5);
    if (cands.length === 0) return null;
    const pick = cands[Math.floor(rng() * cands.length)];
    usedIds.add(pick.i);
    usedNames.add(pick.n);
    return pick;
  });
}

/* ════════ SCORERS ════════ */
export interface Scorer { i: number; n: string; }

function lineOf(pos: Pos): 'GK' | 'DF' | 'MF' | 'FW' {
  if (pos === 'GK') return 'GK';
  if (pos === 'RB' || pos === 'CB' || pos === 'LB') return 'DF';
  if (pos === 'RW' || pos === 'LW' || pos === 'ST') return 'FW';
  return 'MF';
}
const ATTACK_WEIGHT: Record<'GK' | 'DF' | 'MF' | 'FW', number> = { FW: 3, MF: 1.5, DF: 0.5, GK: 0.05 };

export function pickScorers(goals: number, picks: Player[], rng: () => number): Scorer[] {
  if (goals <= 0) return [];
  const weighted = picks.map((p) => ({ p, w: ATTACK_WEIGHT[lineOf(p.pos[0])] * p.r }));
  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  const out: Scorer[] = [];
  for (let g = 0; g < goals; g++) {
    let ticket = rng() * total;
    let chosen = weighted[weighted.length - 1].p;
    for (const { p, w } of weighted) {
      ticket -= w;
      if (ticket <= 0) { chosen = p; break; }
    }
    out.push({ i: chosen.i, n: chosen.n });
  }
  return out;
}

/* ════════ OPPONENT scouting ════════ */
export interface Rival { name: string; edition: string; atk: number; def: number; overall: number; }

export function rivalOf(team: Team): Rival {
  const best = [...team.players].sort((a, b) => b.r - a.r).slice(0, 11);
  const atkers = best.filter((p) => { const l = lineOf(p.pos[0]); return l === 'FW' || l === 'MF'; });
  const backs = best.filter((p) => { const l = lineOf(p.pos[0]); return l === 'DF' || l === 'GK'; });
  return {
    name: team.name,
    edition: team.edition,
    atk: Math.round(avg(atkers.length ? atkers : best)),
    def: Math.round(avg(backs.length ? backs : best)),
    overall: Math.round(avg(best)),
  };
}

/* ════════ DIFFICULTY RAMP (deterministic) ════════
   A cherry-picked cross-era XI out-rates any single real squad, so without
   a ramp the run is a steamroll. This raises the rival's effective strength
   by ladder stage: groups untouched (you should advance), then it climbs to
   a wall in the final — that's where "te moriste en la orilla" earns itself.

   Indexed by stageIdx → LADDER: [g1, g2, r16, qf, sf, final].
   Pure tuning knob: bump these up for harder, down for softer. */
export const STAGE_RAMP: number[] = [0, 0, 1, 3, 5, 7];

/* The rival as the player faces (and scouts) it at a given stage. Adds the
   ramp bonus to atk/def/overall so the scouting card never lies about how
   hard the match actually is. Stays pure/deterministic. */
export function scaledRivalOf(team: Team, stageIdx: number): Rival {
  const r = rivalOf(team);
  const bump = STAGE_RAMP[stageIdx] ?? 0;
  if (bump === 0) return r;
  return { ...r, atk: r.atk + bump, def: r.def + bump, overall: r.overall + bump };
}

/* ════════ MATCH — two halves, one halftime decision ════════ */
export type Attitude = 'def' | 'eq' | 'off';
export interface HalfOutcome { gf: number; ga: number; scorers: Scorer[]; }

/* Kept for the standalone result card type. */
export interface MatchResult { gf: number; ga: number; power: number; isPerfect: boolean; opp: string; }

const clampHalf = (n: number) => Math.max(0, Math.min(6, Math.round(n)));
const ATT: Record<Attitude, { gf: number; ga: number }> = {
  def: { gf: -0.4, ga: -0.6 },
  eq: { gf: 0, ga: 0 },
  off: { gf: 0.6, ga: 0.5 },
};

/* One half vs an opponent of strength `oppOverall`. Deterministic from
   (matchSeed, half, attitude). First half is played 'eq'. */
export function playHalf(
  matchSeed: number,
  half: 1 | 2,
  xi: Player[],
  oppOverall: number,
  attitude: Attitude,
): HalfOutcome {
  const rng = mulberry32((matchSeed ^ (half * 0x9e3779b1)) >>> 0);
  const yourPow = avg(xi) + (rng() - 0.5) * 10;
  const oppPow = oppOverall + (rng() - 0.5) * 10;
  const margin = yourPow - oppPow;
  const a = ATT[attitude];
  const gf = clampHalf(0.8 + margin / 10 + a.gf + rng() * 1.4);
  const ga = clampHalf(0.7 - margin / 14 + a.ga + rng() * 1.2);
  return { gf, ga, scorers: pickScorers(gf, xi, rng) };
}

/* ════════ Penalties (knockout draws) ════════ */
export interface Shootout { you: number; opp: number; }

export function penalties(matchSeed: number, xiAvg: number, oppOverall: number): Shootout {
  const rng = mulberry32((matchSeed ^ 0x50656e21) >>> 0);
  const edge = (xiAvg - oppOverall) / 400;
  const youP = Math.min(0.92, Math.max(0.55, 0.75 + edge));
  const oppP = Math.min(0.92, Math.max(0.55, 0.75 - edge));
  let you = 0, opp = 0;
  for (let i = 0; i < 5; i++) { if (rng() < youP) you++; if (rng() < oppP) opp++; }
  while (you === opp) {
    const y = rng() < youP ? 1 : 0;
    const o = rng() < oppP ? 1 : 0;
    you += y; opp += o;
    if (y !== o) break;
  }
  return { you, opp };
}

/* ════════ Tournament opponent draw (deterministic) ════════ */
export function pickOpponent(matchSeed: number, candidates: string[]): string {
  const rng = mulberry32((matchSeed ^ 0x4f707021) >>> 0);
  return candidates[Math.floor(rng() * candidates.length)];
}