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