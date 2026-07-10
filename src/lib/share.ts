/* ══════════════════════════════════════════
   share.ts — resumen compartible de una corrida (el "brag" estilo Wordle).

   Puro y de shell: reproduce el share-code con el core (playRun) y devuelve
   lo necesario para armar el texto de compartir: cuadraditos por partido en
   orden, stats y desenlace. Nada acá toca semilla ni estado.
══════════════════════════════════════════ */
import { decodeRun } from './sharecode';
import { playRun } from './run';
import { LADDER, type Stage } from './tournament';

export interface RunSummary {
  champion: boolean;
  stage: Stage;        // etapa alcanzada (donde terminó)
  squares: string;     // 🟩🟨🟥 por partido, en orden (vuelta incluida)
  w: number; d: number; l: number;
  gf: number; ga: number;
  avg: number;           // media del once (desempate final: MENOR gana)
}

const SQ = { W: '🟩', D: '🟨', L: '🟥' } as const;

/* Resume una corrida desde su share-code. Devuelve null si el código no
   decodifica o el replay no cierra (nunca debería pasar con un code propio
   recién emitido — el fallback del caller es compartir sin resultado). */
export function summarizeRun(code: string): RunSummary | null {
  const log = decodeRun(code);
  if (!log) return null;
  const r = playRun(log);
  if (!r.ok) return null;
  return {
    champion: r.champion,
    stage: r.stage,
    squares: r.matches.map((m) => SQ[m.outcome]).join(''),
    w: r.stats.w, d: r.stats.d, l: r.stats.l,
    gf: r.stats.gf, ga: r.stats.ga,
    avg: r.xiAvg,
  };
}

/* ── Veredicto del duelo ── mismos criterios de mérito que el salón:
   1) campeón > no campeón; 2) etapa alcanzada; 3) menos derrotas; 4) menos
   empates; 5) mejor diferencia de gol; 6) más goles; 7) once de MENOR media
   (ganar con menos es más mérito). Si todo empata: empate de verdad. */
export type DuelOutcome = 'win' | 'loss' | 'draw';

export function duelVerdict(mine: RunSummary, theirs: RunSummary): DuelOutcome {
  if (mine.champion !== theirs.champion) return mine.champion ? 'win' : 'loss';
  const stageGap = LADDER.indexOf(mine.stage) - LADDER.indexOf(theirs.stage);
  if (stageGap) return stageGap > 0 ? 'win' : 'loss';
  const merit =
    (mine.l - theirs.l) ||
    (mine.d - theirs.d) ||
    ((theirs.gf - theirs.ga) - (mine.gf - mine.ga)) ||
    (theirs.gf - mine.gf) ||
    (mine.avg - theirs.avg);
  if (merit) return merit < 0 ? 'win' : 'loss';
  return 'draw';
}