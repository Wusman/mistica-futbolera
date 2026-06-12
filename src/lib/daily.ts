/* ══════════════════════════════════════════
   daily.ts — modo diario (capa SHELL, no engine):
   acá viven reloj, localStorage y red, que el core puro no toca.
   La fecha solo ELIGE la semilla; la corrida sigue siendo determinista.
══════════════════════════════════════════ */
import { DAILY_WORKER_URL } from '../config';

export interface DailyStats { w: number; d: number; l: number; gf: number; ga: number; avg: number; }

export interface DailyRecord {
  champion: boolean;
  gf: number; ga: number; opp: string; stage: string; // partido decisivo
  stats: DailyStats;
  name?: string; // ya inscripto en la tabla
}

export interface ChampionEntry extends Partial<DailyStats> { name: string; at: number; }

export const dateKeyUTC = (d = new Date()) => d.toISOString().slice(0, 10);
const yesterdayUTC = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

/* ── Racha y vitrina (por dispositivo, como el candado del daily) ──
   streak = días UTC consecutivos COMPLETANDO el torneo del día (abandonar a
   mitad no cuenta, igual que el candado). titles = veces campeón del día. */
export interface StreakMeta { last: string; streak: number; best: number; titles: number; }
const STREAK_KEY = 'mf:streak';

export function loadStreak(): StreakMeta | null {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? (JSON.parse(raw) as StreakMeta) : null;
  } catch { return null; }
}

/* Llamar UNA vez al completarse el daily de hoy (el candado ya garantiza
   un intento por día, así que no hay doble conteo). */
export function bumpStreak(champion: boolean): StreakMeta {
  const today = dateKeyUTC();
  const prev = loadStreak();
  const streak = prev?.last === today
    ? prev.streak // defensa extra ante doble llamada
    : prev?.last === yesterdayUTC()
      ? prev.streak + 1
      : 1;
  const meta: StreakMeta = {
    last: today,
    streak,
    best: Math.max(streak, prev?.best ?? 0),
    titles: (prev?.titles ?? 0) + (prev?.last === today ? 0 : champion ? 1 : 0),
  };
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(meta)); } catch { /* incógnito */ }
  return meta;
}
const lsKey = (date: string) => `mf:daily:${date}`;

/* try/catch: en modo incógnito localStorage puede fallar — sin candado, pero
   sin romper el juego. */
export function loadDaily(date = dateKeyUTC()): DailyRecord | null {
  try {
    const raw = localStorage.getItem(lsKey(date));
    return raw ? (JSON.parse(raw) as DailyRecord) : null;
  } catch { return null; }
}

export function saveDaily(rec: DailyRecord, date = dateKeyUTC()): void {
  try { localStorage.setItem(lsKey(date), JSON.stringify(rec)); } catch { /* incógnito */ }
}

export async function fetchChampions(date = dateKeyUTC()): Promise<ChampionEntry[]> {
  const res = await fetch(`${DAILY_WORKER_URL}/daily/${date}`);
  if (!res.ok) throw new Error('board_fetch_failed');
  const data: unknown = await res.json();
  const list = (data as { champions?: unknown }).champions;
  return Array.isArray(list) ? (list as ChampionEntry[]) : [];
}

export async function submitChampion(entry: { name: string } & DailyStats, date = dateKeyUTC()): Promise<void> {
  const res = await fetch(`${DAILY_WORKER_URL}/daily/${date}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('board_submit_failed');
}

/* Orden de mérito del día (criterios de Wus): menos derrotas, menos empates,
   mejor diferencia de gol, más goles a favor y — desempate final — el once
   de MENOR media (ganar con menos es más mérito). Puro y estable. */
export function sortChampions(list: ChampionEntry[]): ChampionEntry[] {
  return [...list].sort((a, b) =>
    (a.l ?? 99) - (b.l ?? 99) ||
    (a.d ?? 99) - (b.d ?? 99) ||
    ((b.gf ?? 0) - (b.ga ?? 99)) - ((a.gf ?? 0) - (a.ga ?? 99)) ||
    (b.gf ?? 0) - (a.gf ?? 0) ||
    (a.avg ?? 99) - (b.avg ?? 99) ||
    a.at - b.at,
  );
}