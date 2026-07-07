import { useEffect, useRef, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { Timeline } from './Timeline';

/* ── Tunables del relato (ajustá a gusto) ──
   duration: segundos que corre el reloj por mitad.
   holdEnd:  pausa en 45'/90' antes de avanzar solo. */
const TICK = { duration: 4.2, holdEnd: 0.7 };

interface Props {
  from: number;            // 0 (1er tiempo) ó 45 (2do)
  to: number;              // 45 ó 90
  events: TickerEvent[];   // solo los goles de este segmento
  priorEvents?: TickerEvent[]; // goles ya ocurridos antes (para no reiniciar la ficha)
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
export function MatchTicker({ from, to, events, priorEvents = [], baseGf = 0, baseGa = 0, oppName, halfLabel, endLabel, duration = TICK.duration, onDone }: Props) {
  const t = useT();
  const reduce = useReducedMotion();

  /* Cinturón de seguridad: si una prop llega rota (típico: archivos
     desfasados al pegar a mano), el relato degrada a valores sanos en vez de
     congelarse en silencio. Sin reasignar props (regla del React Compiler). */
  if (!Number.isFinite(to)) console.warn('[MatchTicker] prop `to` inválida:', to, '— usando fin de mitad por defecto');
  if (!Number.isFinite(duration) || duration <= 0) console.warn('[MatchTicker] prop `duration` inválida:', duration);
  const safeTo = Number.isFinite(to) ? to : from < 45 ? 45 : 90;
  const safeDur = Number.isFinite(duration) && duration > 0 ? duration : TICK.duration;

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
    const ctrl = animate(from, safeTo, {
      duration: safeDur,
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
    setMin(safeTo);
    doneRef.current = true;
    onDone();
  };

  const shownMin = reduce ? safeTo : min;
  const ended = shownMin >= safeTo;
  const visible = events.filter((e) => e.min <= shownMin);
  /* Reloj con descuento: pasada la hora de la mitad, muestra 45+X / 90+X. */
  const base = from < 45 ? 45 : 90;
  const clock = shownMin <= base ? `${shownMin}’` : `${base}+${shownMin - base}’`;
  const gf = baseGf + visible.filter((e) => e.side === 'you').length;
  const ga = baseGa + visible.filter((e) => e.side === 'opp').length;

  /* ── Momento gol ── el marcador PEGA (punch con spring, keyed por valor) y,
     si el gol es tuyo, un flash dorado que se apaga. Presentación pura:
     todo deriva de `visible`; nada retroalimenta al core. Solo transform/
     opacity. Con movimiento reducido no hay punch ni flash. */
  const punch = reduce
    ? undefined
    : { initial: { scale: 1.55, opacity: 0.4 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 320, damping: 17 } };

  return (
    <motion.div
      className="ticker"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={skip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } }}
      role="button"
      tabIndex={0}
      title={t('ticker.skip')}
    >
      {!reduce && gf > baseGf && (
        <motion.div
          key={`flash-${gf}`}
          className="ticker-flash"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}
      <p className="ticker-half">{ended ? endLabel : halfLabel}</p>
      <div className="ticker-score" aria-live="polite">
        <motion.span key={`gf-${gf}`} className="ticker-gf" {...punch}>{gf}</motion.span>
        <span className="ticker-sep">–</span>
        <motion.span key={`ga-${ga}`} className="ticker-ga" {...punch}>{ga}</motion.span>
      </div>
      <p className="ticker-min">{clock}</p>
      <Timeline events={[...priorEvents, ...visible]} oppName={oppName} prior={priorEvents} />
      <p className="reel-hint">{t('ticker.skip')}</p>
    </motion.div>
  );
}