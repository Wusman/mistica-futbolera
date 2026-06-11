import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';

/* ── Tunables del relato (ajustá a gusto) ──
   duration: segundos que corre el reloj por mitad.
   holdEnd:  pausa en 45'/90' antes de avanzar solo. */
const TICK = { duration: 4.2, holdEnd: 0.7 };

interface Props {
  from: number;            // 0 (1er tiempo) ó 45 (2do)
  to: number;              // 45 ó 90
  events: TickerEvent[];   // solo los goles de esta mitad
  baseGf?: number;         // marcador acumulado al arrancar (2do tiempo)
  baseGa?: number;
  oppName: string;
  halfLabel: string;
  endLabel: string;
  duration?: number;       // seg que corre el reloj (grupos vs eliminatorias)
  onDone: () => void;
}

/* Presentación pura: los goles ya están decididos por el engine; esto solo
   los "transmite" con un reloj que corre. Tocá para saltar; con movimiento
   reducido va directo al final. No toca semilla ni estado del juego. */
export function MatchTicker({ from, to, events, baseGf = 0, baseGa = 0, oppName, halfLabel, endLabel, duration = TICK.duration, onDone }: Props) {
  const t = useT();
  const reduce = useReducedMotion();
  const [min, setMin] = useState(from);
  const doneRef = useRef(false);
  const ctrlRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      window.setTimeout(() => { if (!cancelled) onDone(); }, TICK.holdEnd * 1000);
    };
    if (reduce) {
      finish(); // el valor mostrado se deriva (ver shownMin); solo programamos el cierre
      return;
    }
    const ctrl = animate(from, to, {
      duration,
      ease: 'linear',
      onUpdate: (v) => setMin(Math.floor(v)),
      onComplete: finish,
    });
    ctrlRef.current = ctrl;
    return () => { cancelled = true; ctrl.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (doneRef.current) return;
    ctrlRef.current?.stop();
    setMin(to);
    doneRef.current = true;
    onDone();
  };

  const shownMin = reduce ? to : min;
  const ended = shownMin >= to;
  const visible = events.filter((e) => e.min <= shownMin);
  const gf = baseGf + visible.filter((e) => e.side === 'you').length;
  const ga = baseGa + visible.filter((e) => e.side === 'opp').length;

  return (
    <div
      className="ticker"
      onClick={skip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } }}
      role="button"
      tabIndex={0}
      title={t('ticker.skip')}
    >
      <p className="ticker-half">{ended ? endLabel : halfLabel}</p>
      <div className="ticker-score" aria-live="polite">
        <span className="ticker-gf">{gf}</span>
        <span className="ticker-sep">–</span>
        <span className="ticker-ga">{ga}</span>
      </div>
      <p className="ticker-min">{shownMin}&rsquo;</p>
      <ul className="ticker-events">
        {visible.map((e, k) => (
          <motion.li
            key={k}
            className={`ticker-ev ${e.side === 'you' ? 'ticker-ev--you' : ''}`}
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            {e.min}&rsquo; ⚽ {e.n ?? t('ticker.goalOpp', { opp: oppName })}
          </motion.li>
        ))}
      </ul>
      <p className="reel-hint">{t('ticker.skip')}</p>
    </div>
  );
}