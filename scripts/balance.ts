/* ── Banco de balance del torneo ──
   Mide la salud del juego con el motor REAL (runWith): qué % de semillas de
   diario son ganables jugando bien (techo ≈ mejor de 100 secuencias de
   actitudes), jugando naive (todo 'eq'), y con un draft malo. Correr tras
   cualquier cambio de STAGE_RAMP, ATT o fórmulas de playHalf:

     npx tsx scripts/balance.ts            → métricas sobre 120 semillas
     npx tsx scripts/balance.ts <semilla>  → fuerza bruta de UNA semilla
                                             (¿existe algún camino campeón?)

   Objetivos calibrados (ene 2026): techo ~45%, naive ~20-25%, draft malo 0%.
   Si un cambio los mueve fuerte, es una decisión de diseño, no un accidente. */
import { seedFromInput, type Attitude, type PenAim, type Player } from '../src/lib/engine';
import { runWith, type RunDriver, type DraftMove } from '../src/lib/run';

const ATTS: Attitude[] = ['def', 'eq', 'off'];

function driver(seq: Attitude[], skip: number, aim: PenAim = 'C'): RunDriver {
  let a = 0;
  return {
    draft(eligible: Player[], slotsFor: (p: Player) => number[], canPass: boolean): DraftMove | undefined {
      const ranked = [...eligible].sort((x, y) => y.r - x.r);
      const order = skip > 0 ? [...ranked.slice(skip), ...ranked.slice(0, skip)] : ranked;
      for (const p of order) { const s = slotsFor(p); if (s.length) return { pick: { player: p.i, slot: s[0] } }; }
      return canPass ? { pass: true } : undefined;
    },
    attitude: () => seq[a++] ?? 'eq',
    penAim: () => aim,
    shoot: () => aim,
  };
}

const arg = process.argv[2];
if (arg) {
  /* Fuerza bruta de una semilla: 3 palos × 3^9 secuencias de actitud. */
  const seed = seedFromInput(arg);
  if (seed === null) { console.error('Semilla inválida:', arg); process.exit(1); }
  let wins = 0; let sample = '';
  for (const aim of ['L', 'C', 'R'] as PenAim[]) {
    for (let mask = 0; mask < 3 ** 9; mask++) {
      const seq: Attitude[] = []; let m = mask;
      for (let i = 0; i < 9; i++) { seq.push(ATTS[m % 3]); m = Math.floor(m / 3); }
      const r = runWith(seed, '4-3-3', driver(seq, 0, aim));
      if (r.champion) {
        wins++;
        if (!sample) sample = `aim:${aim} seq:${seq.join(',')}\n  ` + r.matches.map((x) => `${x.oppName}${x.leg ? ` V${x.leg}` : ''} ${x.gf}-${x.ga}${x.pens ? 'p' : ''} ${x.outcome}`).join(' | ');
      }
    }
  }
  console.log(`Semilla ${seed.toString(36)}: ${wins} caminos campeones de ${3 * 3 ** 9}`);
  if (sample) console.log('Ejemplo:\n  ' + sample);
} else {
  /* Métricas de salud sobre un lote fijo de semillas (reproducible). */
  let s = 12345;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
  const SEEDS = Array.from({ length: 120 }, (_, i) => (i * 2654435761 + 97) >>> 0);
  let winNaive = 0, winCeil = 0, winBad = 0, groupDeaths = 0;
  for (const seed of SEEDS) {
    const naive = runWith(seed, '4-3-3', driver(Array(9).fill('eq'), 0));
    if (naive.champion) winNaive++;
    if (naive.stage === 'g1' || naive.stage === 'g2') groupDeaths++;
    if (runWith(seed, '4-3-3', driver(Array(9).fill('eq'), 3)).champion) winBad++;
    let won = naive.champion;
    for (let t = 0; t < 100 && !won; t++) {
      const seq = Array.from({ length: 9 }, () => ATTS[Math.floor(rnd() * 3)]);
      if (runWith(seed, '4-3-3', driver(seq, 0)).champion) won = true;
    }
    if (won) winCeil++;
  }
  const pc = (n: number) => (n / 1.2).toFixed(0) + '%';
  console.log(`techo:${pc(winCeil)}  naive:${pc(winNaive)}  draft-malo:${pc(winBad)}  muere-en-grupos(naive):${pc(groupDeaths)}`);
}