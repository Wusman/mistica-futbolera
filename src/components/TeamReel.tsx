import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type Team } from '../data/players';
import { mulberry32, hashSeed } from '../lib/engine';
import { teamPattern } from '../lib/escudo';
import { Emblem } from './Emblem';
import { useT } from '../i18n';

/* ── Tunables del tambor ──
   cells: equipos que pasan antes de clavar el sorteado.
   minTick/maxTick: ms entre saltos (arranca rápido, frena en seco).
   hold: pausa al clavar antes de avanzar. */
const REEL = { cells: 13, minTick: 55, maxTick: 380, hold: 420 };
/* Rondas siguientes: el drama ya se vivió — el tambor clava rápido para que
   el draft fluya (la repetición mata la ceremonia). */
const REEL_QUICK = { cells: 5, minTick: 50, maxTick: 150, hold: 240 };

interface Props {
  teams: Team[];
  target: Team;
  spinKey: string;
  label?: string;
  quick?: boolean;   // true desde la 2ª ronda: giro corto
  onDone: () => void;
}

/* Secuencia barajada DETERMINISTA desde spinKey (sin Math.random): el campeón
   ya está decidido por el engine; esto es presentación pura. */
function buildSeq(teams: Team[], target: Team, spinKey: string, cells: number): Team[] {
  const rng = mulberry32(hashSeed(spinKey));
  const pool = teams.filter((t) => t.id !== target.id);
  const seq: Team[] = [];
  let last = '';
  while (seq.length < cells - 1 && pool.length > 0) {
    const t = pool[Math.floor(rng() * pool.length)];
    if (t.id === last) continue;
    seq.push(t);
    last = t.id;
  }
  seq.push(target);
  return seq;
}

/* Tambor tipo tragamonedas: los nombres pasan en seco (tick-tick-tick) y el
   sorteado CLAVA con un pop. Una celda visible a la vez = robusto en cualquier
   viewport. Tocá para saltar; con movimiento reducido va directo. */
export function TeamReel({ teams, target, spinKey, label, quick, onDone }: Props) {
  const t = useT();
  const reduce = useReducedMotion();
  const R = quick ? REEL_QUICK : REEL;
  const seq = buildSeq(teams, target, spinKey, R.cells);
  const lastIdx = seq.length - 1;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  /* Reset al cambiar de sorteo (prop-change-in-render: solo setState). */
  const [prevKey, setPrevKey] = useState(spinKey);
  if (prevKey !== spinKey) {
    setPrevKey(spinKey);
    setIdx(0);
    setDone(false);
  }

  const shownIdx = reduce || done ? lastIdx : idx;
  const landed = shownIdx >= lastIdx;
  const cell = seq[shownIdx];

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    const finishAfterHold = () => {
      timers.push(window.setTimeout(() => { if (!cancelled) onDone(); }, R.hold));
    };

    if (reduce) {
      finishAfterHold();
      return () => { cancelled = true; timers.forEach(window.clearTimeout); };
    }

    let i = 0;
    const step = () => {
      if (cancelled) return;
      i++;
      setIdx(i);
      if (i >= lastIdx) { finishAfterHold(); return; }
      const p = i / lastIdx;
      const delay = R.minTick + (R.maxTick - R.minTick) * p * p * p; // frena al final
      timers.push(window.setTimeout(step, delay));
    };
    timers.push(window.setTimeout(step, R.minTick));

    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, reduce, quick]);

  const skip = () => {
    if (done || landed) return;
    setDone(true);
    window.setTimeout(onDone, 120);
  };

  return (
    <div
      className="reel"
      onClick={skip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } }}
      role="button"
      tabIndex={0}
      title={t('ticker.skip')}
    >
      {label && <p className="reel-label">{label}</p>}
      <div className={`reel-window ${landed ? 'reel-window--hit' : ''}`}>
        <motion.div
          key={`${spinKey}:${shownIdx}`}
          className="reel-cell"
          initial={reduce ? false : { y: 16, opacity: 0.4 }}
          animate={landed && !reduce
            ? { y: 0, opacity: 1, scale: [1.12, 1], transition: { type: 'spring', stiffness: 320, damping: 16 } }
            : { y: 0, opacity: 1, transition: { duration: 0.06, ease: 'linear' } }}
        >
          {landed && (
            <Emblem colors={cell.colors} pattern={teamPattern(cell.colors)} size={40} className="reel-crest" />
          )}
          <span className="reel-name">{cell.name}</span>
          <span className="reel-ed">{cell.edition}</span>
        </motion.div>
      </div>
      <p className="reel-hint">{t('ticker.skip')}</p>
    </div>
  );
}