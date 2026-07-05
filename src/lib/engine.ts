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

/* Semilla EFECTIVA del torneo del día: la fecha con salt. Misma para todos
   hoy, pero no es trivialmente derivable de la fecha "a ojo" y la carta del
   daily no la muestra → practicarla antes en modo libre exige leer el código.
   Mitigación v1; el comprobante real será el share-code. */
export function dailyRunSeed(date = new Date()): number {
  return hashSeed(`daily:${date.toISOString().slice(0, 10)}`);
}

/* ── Semilla desde texto (input del home). Puro. ──
   Round-trip exacto de semillas generadas (base36 ≤ 0xffffffff) y cualquier
   palabra como semilla custom vía hash ("messi" siempre da el mismo torneo). */
export function seedFromInput(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (/^[0-9a-z]{1,7}$/.test(v)) {
    const n = parseInt(v, 36);
    if (n <= 0xffffffff) return n >>> 0;
  }
  return hashSeed(v);
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
/* Compatibilidad de puestos: cada puesto de la cancha acepta sus vecinos
   naturales (un wing juega de volante por la banda y viceversa; un volante
   central baja a 5 o sube a enganche). Evita drafts trabados cuando el
   dataset es corto en un rol puro (ej.: pocos MD/MI) sin romper las líneas:
   defensa y arco no se mezclan con el medio. */
const SLOT_COMPAT: Partial<Record<Pos, Pos[]>> = {
  RM: ['RM', 'RW'],
  LM: ['LM', 'LW'],
  RW: ['RW', 'RM'],
  LW: ['LW', 'LM'],
  DM: ['DM', 'CM'],
  AM: ['AM', 'CM'],
};

export function fitsSlot(player: Player, slotPos: Pos): boolean {
  const ok = SLOT_COMPAT[slotPos] ?? [slotPos];
  return player.pos.some((p) => (ok as Pos[]).includes(p));
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
      .filter((p) => fitsSlot(p, slot.pos) && !usedIds.has(p.i) && !usedNames.has(p.n))
      .sort((a, b) => b.r - a.r)
      .slice(0, 5);
    if (cands.length === 0) return null;
    const pick = cands[Math.floor(rng() * cands.length)];
    usedIds.add(pick.i);
    usedNames.add(pick.n);
    return pick;
  });
}

/* Nombre corto para fichas y slots: último apellido CON sus partículas
   ("Ángel Di María" → "Di María", "van der Sar" → "van der Sar"), más un
   puñado de excepciones donde el apellido va primero o el uso manda. */
const NAME_PARTICLES = new Set(['di', 'de', 'del', 'della', 'da', 'dos', 'das', 'van', 'von', 'der', 'den', 'ter', 'ten', 'le', 'la', 'el', 'al']);
const SHORT_OVERRIDES: Record<string, string> = {
  'Son Heung-min': 'Son',
  'Roberto Carlos': 'R. Carlos',
};

export function shortName(name: string): string {
  const clean = name.replace(/"/g, '').trim();
  if (SHORT_OVERRIDES[clean]) return SHORT_OVERRIDES[clean];
  const parts = clean.split(/\s+/);
  let i = parts.length - 1;
  while (i > 0 && NAME_PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(' ');
}

/* El once "tipo" de un equipo: sus 11 mejores por rating. */
export function bestXI(team: Team): Player[] {
  return [...team.players].sort((a, b) => b.r - a.r).slice(0, 11);
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

/* Perfil de un once: ataque (FW+MF) y defensa (DF+GK), como rivalOf pero
   para TU equipo — el versus muestra lo mismo de ambos lados. Puro. */
export function xiProfile(xi: Player[]): { atk: number; def: number } {
  const at = xi.filter((p) => { const l = lineOf(p.pos[0]); return l === 'FW' || l === 'MF'; });
  const bk = xi.filter((p) => { const l = lineOf(p.pos[0]); return l === 'DF' || l === 'GK'; });
  return {
    atk: Math.round(avg(at.length ? at : xi)),
    def: Math.round(avg(bk.length ? bk : xi)),
  };
}

/* ════════ DIFFICULTY RAMP (deterministic) ════════
   A cherry-picked cross-era XI out-rates any single real squad, so without
   a ramp the run is a steamroll. This raises the rival's effective strength
   by ladder stage: groups untouched (you should advance), then it climbs to
   a wall in the final — that's where "te moriste en la orilla" earns itself.

   Indexed by stageIdx → LADDER: [g1, g2, r16, qf, sf, final].
   Pure tuning knob: bump these up for harder, down for softer. */
/* Rampa suavizada (antes [0,0,1,3,5,7]): ganarla tiene que ser difícil,
   no castigo. Sigue siendo el knob #1 de dificultad. */
/* Rampa de dificultad por etapa. Calibrada con el banco de balance
   (scripts/balance.ts, ene 2026): la anterior [0,0,1,2,4,6] hacía el diario
   matemáticamente imposible el ~80% de los días (0 caminos ganadores en
   59k combinaciones de decisiones). Con esta, ~45% de los días son ganables
   jugando bien, ~22% jugando naive, 0% con draft malo: difícil, no imposible. */
export const STAGE_RAMP: number[] = [0, 0, 1, 1, 2, 3];

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
/* Actitudes con dientes (calibradas con el banco de balance): antes el
   efecto neto en la diferencia de gol era ~+0.2/+0.1 — la decisión dramática
   del entretiempo era estratégicamente casi neutra. Ahora `def` ACHICA el
   partido (protege ventajas) y `off` lo ABRE (persigue resultados): la
   elección correcta depende del marcador, que es exactamente lo que una
   decisión de entretiempo debe ser. */
const ATT: Record<Attitude, { gf: number; ga: number }> = {
  def: { gf: -0.5, ga: -0.9 },
  eq: { gf: 0, ga: 0 },
  off: { gf: 0.9, ga: 0.6 },
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

/* ════════ RELATO — minutos de gol (deterministas) ════════
   Los goles ya están decididos por playHalf; esto solo les asigna un minuto
   dentro de su mitad para el ticker. Presentación derivada del matchSeed:
   no agrega azar nuevo ni toca el share-code. */
export interface TickerEvent { min: number; side: 'you' | 'opp'; n?: string; p?: boolean; h?: 1 | 2; }

/* Mitad de un evento (compat con eventos viejos sin h). */
export const evHalf = (e: TickerEvent): 1 | 2 => e.h ?? (e.min > 45 ? 2 : 1);

/* "47" en el 1er tiempo es 45+2; en el 2do, 47'. Y 90+X en el añadido. */
export function fmtMin(e: TickerEvent): string {
  const base = evHalf(e) === 1 ? 45 : 90;
  return e.min <= base ? `${e.min}’` : `${base}+${e.min - base}’`;
}

/* Descuento de la mitad: 1 a 7 minutos, determinista del matchSeed. */
export function addedTime(matchSeed: number, half: 1 | 2): number {
  const rng = mulberry32((matchSeed ^ Math.imul(half, 0x414444)) >>> 0); // "ADD"
  return 1 + Math.floor(rng() * 7);
}

export function halfEvents(
  matchSeed: number,
  half: 1 | 2,
  out: HalfOutcome,
  oppXI?: Player[],
): TickerEvent[] {
  const base = half === 1 ? 1 : 46;
  /* Descuentos: la mitad dura hasta 45+X / 90+X (X∈1..7 del seed). Los goles
     pueden caer en el añadido — drama del 90+6'. */
  const hi = (half === 1 ? 45 : 90) + addedTime(matchSeed, half);
  /* Minutos ÚNICOS en la mitad (entre ambos equipos): dos goles en el mismo
     minuto rompen la ilusión y el ticker los hace aparecer juntos. Si un
     sorteo cae en minuto ocupado, se corre al hueco libre más cercano.
     Determinista: mismo seed → mismos minutos. */
  const used = new Set<number>();
  const claim = (m: number): number => {
    let x = m;
    while (used.has(x) && x < hi) x++;
    while (used.has(x) && x > base) x--;
    used.add(x);
    return x;
  };
  const minutesFor = (salt: number, count: number) => {
    const rng = mulberry32((matchSeed ^ (half * 0x9e3779b1) ^ salt) >>> 0);
    const mins: number[] = [];
    for (let i = 0; i < count; i++) mins.push(claim(base + Math.floor(rng() * (hi - base + 1))));
    return mins.sort((a, b) => a - b);
  };
  const yours = minutesFor(0x474f4c21, out.gf);
  const theirs = minutesFor(0x474f4c32, out.ga);
  /* Autor del gol rival: ilusión para el usuario (igual que los tuyos, no
     afecta la simulación). Determinista y ponderado por ataque del rival. */
  const oppScorers = oppXI && out.ga > 0
    ? pickScorers(out.ga, oppXI, mulberry32((matchSeed ^ (half * 0x9e3779b1) ^ 0x4e414d45) >>> 0))
    : [];
  const ev: TickerEvent[] = [
    ...yours.map((min, i) => ({ min, side: 'you' as const, n: out.scorers[i]?.n, h: half })),
    ...theirs.map((min, j) => ({ min, side: 'opp' as const, n: oppScorers[j]?.n, h: half })),
  ];
  return ev.sort((a, b) => a.min - b.min);
}

/* ════════ PENALES interactivos (eliminatorias empatadas) ════════
   Determinismo: la dirección del tiro es una DECISIÓN del jugador (como la
   actitud del entretiempo) y entra al share-code. Todo el azar (atajada del
   arquero, calidad del remate, penal rival) se deriva del matchSeed y del
   índice del tiro — y NUNCA de la dirección elegida, así no hay forma de
   "fishear" un palo mejor. Misma semilla + mismos tiros = misma tanda. */
export interface Shootout { you: number; opp: number; }

export type PenAim = 'L' | 'C' | 'R';
export interface PenKickResult { aim: PenAim; dive: PenAim; scored: boolean; }

const PEN_DIRS: PenAim[] = ['L', 'C', 'R'];

/* Tu tiro i (0-indexado). El arquero y el roll se sortean ANTES de mirar tu
   dirección: elegir solo cambia el cruce, no la suerte. */
export function penKick(matchSeed: number, i: number, aim: PenAim, xiAvg: number, oppOverall: number): PenKickResult {
  const rng = mulberry32((matchSeed ^ 0x50454e4b ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0);
  const dive = PEN_DIRS[Math.floor(rng() * 3)];
  const roll = rng();
  const edge = (xiAvg - oppOverall) / 200;
  const scored = dive === aim
    ? roll < Math.min(0.55, Math.max(0.18, 0.32 + edge))   // te adivinó: casi siempre ataja
    : roll < Math.min(0.98, Math.max(0.82, 0.93 + edge));  // palo equivocado: casi siempre gol
  return { aim, dive, scored };
}

/* Penal en jugada: ~6% de las mitades CON goles convierten uno de los goles
   ya decididos en penal interactivo. Existencia, gol elegido y minuto:
   deterministas del matchSeed. El RESULTADO depende de tu decisión (palo o
   estirada): si se falla, ese gol no ocurre. v1 se usa solo en el 1er tiempo;
   la firma ya acepta half=2 para extenderlo. */
export interface HalfPen { min: number; side: 'you' | 'opp'; }

export function halfPenalty(matchSeed: number, half: 1 | 2, ev: TickerEvent[]): HalfPen | null {
  const rng = mulberry32((matchSeed ^ Math.imul(half, 0x50454e21)) >>> 0); // "PEN!"
  const roll = rng();
  const pick = rng(); // se sortean SIEMPRE ambos (estabilidad del stream)
  if (ev.length === 0 || roll >= 0.10) return null; // ~10% por mitad con gol: ~1 penal por corrida
  const e = ev[Math.floor(pick * ev.length)];
  return { min: e.min, side: e.side };
}

/* Sorteo de la tanda: quién arranca pateando (determinista del matchSeed). */
export function penCoinToss(matchSeed: number): 'you' | 'opp' {
  const rng = mulberry32((matchSeed ^ 0x544f5353) >>> 0); // ^ "TOSS"
  return rng() < 0.5 ? 'you' : 'opp';
}

/* Penal rival i: SU palo se sortea de la semilla (nunca depende de tu
   atajada); vos elegís dónde se tira TU arquero (dive = decisión tuya).
   Si adivinás, atajás casi siempre; si no, casi siempre es gol. */
export interface OppPenResult { aim: PenAim; dive: PenAim; scored: boolean; }

export function oppPenShot(matchSeed: number, i: number, dive: PenAim, xiAvg: number, oppOverall: number): OppPenResult {
  const rng = mulberry32((matchSeed ^ 0x4f50454e ^ Math.imul(i + 1, 0x85ebca6b)) >>> 0);
  const aim = PEN_DIRS[Math.floor(rng() * 3)];
  const roll = rng();
  const edge = (oppOverall - xiAvg) / 200;
  const scored = dive === aim
    ? roll < Math.min(0.55, Math.max(0.18, 0.32 + edge))   // le adivinaste: atajás casi siempre
    : roll < Math.min(0.98, Math.max(0.82, 0.93 + edge));  // palo equivocado: casi siempre gol
  return { aim, dive, scored };
}

/* De quién es el próximo penal: alternancia estricta desde `first` (sorteo). */
export function pensTurn(first: 'you' | 'opp', yKicks: number, oKicks: number): 'you' | 'opp' {
  const other = first === 'you' ? 'opp' : 'you';
  return (yKicks + oKicks) % 2 === 0 ? first : other;
}

/* Reglas de la tanda: mejor de 5 con corte anticipado, luego muerte súbita.
   Orden fijo: pateás vos, después el rival. Puro. */
export function shootoutWinner(you: boolean[], opp: boolean[]): 'you' | 'opp' | null {
  const ys = you.filter(Boolean).length;
  const os = opp.filter(Boolean).length;
  const yPend = Math.max(5 - you.length, opp.length - you.length, 0);
  const oPend = Math.max(5 - opp.length, you.length - opp.length, 0);
  if (ys > os + oPend) return 'you';
  if (os > ys + yPend) return 'opp';
  if (you.length === opp.length && you.length >= 5 && ys !== os) return ys > os ? 'you' : 'opp';
  return null;
}

/* ════════ Tournament opponent draw (deterministic) ════════ */
/* Peso del sorteo por etapa: en grupos es lotería pura (la varianza es la
   gracia); de octavos a la final, los equipos fuertes pesan cada vez más —
   en la final, el mejor del pool es ~7x más probable que el peor. */
export const DRAW_WEIGHT: number[] = [0, 0, 1.5, 2.5, 4, 6];

export function pickOpponent(matchSeed: number, candidates: string[], teams: Team[], stageIdx = 0): string {
  const rng = mulberry32((matchSeed ^ 0x4f707021) >>> 0);
  const k = DRAW_WEIGHT[stageIdx] ?? 0;
  if (k === 0 || candidates.length <= 1) {
    return candidates[Math.floor(rng() * candidates.length)];
  }
  const ovs = candidates.map((id) => rivalOf(teams.find((t) => t.id === id)!).overall);
  const lo = Math.min(...ovs), hi = Math.max(...ovs);
  const ws = ovs.map((o) => 1 + (hi === lo ? 0 : (o - lo) / (hi - lo)) * k);
  let ticket = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) {
    ticket -= ws[i];
    if (ticket <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}