import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type Team } from '../data/players';
import { mulberry32, hashSeed } from '../lib/engine';
import { useT } from '../i18n';

/* ── Tunables del tambor ──
   cells: cuántos equipos pasan antes de clavar el sorteado.
   duration: seg del giro. cellH: alto de cada celda (px). */
const REEL = { cells: 12, duration: 1.7, cellH: 92 };

interface Props {
  teams: Team[];
  target: Team;
  spinKey: string;
  label?: string;
  onDone: () => void;
}

/* Secuencia del tambor barajada DETERMINISTA desde spinKey (sin Math.random):
   el campeón ya está decidido por el engine; esto es presentación pura. */
function buildSeq(teams: Team[], target: Team, spinKey: string): Team[] {
  const rng = mulberry32(hashSeed(spinKey));
  const pool = teams.filter((t) => t.id !== target.id);
  const seq: Team[] = [];
  let last = '';
  while (seq.length < REEL.cells - 1 && pool.length > 0) {
    const t = pool[Math.floor(rng() * pool.length)];
    if (t.id === last) continue;
    seq.push(t);
    last = t.id;
  }
  seq.push(target);
  return seq;
}

/* Tambor VERTICAL estilo tragamonedas: cae rápido y frena en el campeón.
   Lee mucho mejor en celular que un strip horizontal. Tocá para saltar;
   con movimiento reducido va directo al resultado. */
export function TeamReel({ teams, target, spinKey, label, onDone }: Props) {
  const t = useT();
  const reduce = useReducedMotion();
  const doneRef = useRef(false);
  const [skipped, setSkipped] = useState(false);

  /* Reset al cambiar de sorteo (prop-change-in-render). */
  const [prevKey, setPrevKey] = useState(spinKey);
  if (prevKey !== spinKey) {
    setPrevKey(spinKey);
    setSkipped(false);
    doneRef.current = false;
  }

  const seq = buildSeq(teams, target, spinKey);
  const finalY = -(seq.length - 1) * REEL.cellH;
  const instant = reduce || skipped;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    window.setTimeout(onDone, instant ? 80 : 260); // micro-pausa al clavar
  };

  const skip = () => {
    if (doneRef.current) return;
    setSkipped(true);
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
      <div className="reel-window" style={{ height: REEL.cellH }}>
        <motion.div
          key={`${spinKey}:${instant ? 'i' : 'a'}`}
          className="reel-strip"
          initial={{ y: instant ? finalY : 0 }}
          animate={{ y: finalY }}
          transition={instant ? { duration: 0 } : { duration: REEL.duration, ease: [0.16, 0.84, 0.22, 1] }}
          onAnimationComplete={finish}
        >
          {seq.map((tm, i) => (
            <div className="reel-cell" key={i} style={{ height: REEL.cellH }}>
              <div className="club-colors">
                {tm.colors.map((c, k) => (
                  <span key={k} style={{ background: c }} />
                ))}
              </div>
              <span className="reel-name">{tm.name}</span>
              <span className="reel-ed">{tm.edition}</span>
            </div>
          ))}
        </motion.div>
      </div>
      <p className="reel-hint">{t('ticker.skip')}</p>
    </div>
  );
}