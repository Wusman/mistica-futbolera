import { motion, useReducedMotion } from 'framer-motion';
import { type TickerEvent, fmtMin } from '../lib/engine';

interface Props {
  /* Goles a mostrar (se ordenan por minuto acá adentro). */
  events: TickerEvent[];
  /* Nombre del rival: fallback de autor cuando un gol rival no viene nombrado. */
  oppName: string;
  /* Subconjunto de `events` que ya ocurrió en segmentos anteriores del relato:
     aparece sin animación de entrada. Se identifica por referencia (no por
     minuto: los goles del descuento del 1er tiempo comparten rango con el 2do).
     La carta final no lo pasa → todos animan al abrirse. */
  prior?: TickerEvent[];
  /* Cascada al montar (carta final). El ticker lo deja en false: cada gol
     anima solo cuando entra al hacerse visible. */
  stagger?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 26 };

/* Ficha de partido de dos lados — presentación pura. No decide nada: los goles
   ya vienen resueltos por el engine (autor + minuto). El ticker le pasa la
   historia acumulada gol a gol; la carta final le pasa el partido entero. */
export function Timeline({ events, oppName, prior, stagger = false }: Props) {
  const reduce = useReducedMotion();
  if (events.length === 0) return null;
  const priorSet = prior && prior.length ? new Set(prior) : null;
  const goals = [...events].sort((a, b) => a.min - b.min);

  return (
    <ol className="timeline">
      {goals.map((e, k) => {
        const isPrior = priorSet ? priorSet.has(e) : false;
        const doAnim = !reduce && !isPrior;
        return (
          <motion.li
            key={`${e.side}-${e.min}-${e.n ?? 'opp'}-${k}`}
            className={`tl-goal ${e.side === 'you' ? 'tl-goal--you' : 'tl-goal--opp'}`}
            initial={doAnim ? { opacity: 0, y: -7, scale: 0.85 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={doAnim ? { ...spring, delay: stagger ? Math.min(k * 0.06, 0.5) : 0 } : { duration: 0 }}
          >
            <span className="tl-min">
              {fmtMin(e)}
              {e.p && <span className="tl-pen" aria-label="Penal" title="Penal">P</span>}
            </span>
            <span className="tl-name">{e.n ?? oppName}</span>
          </motion.li>
        );
      })}
    </ol>
  );
}