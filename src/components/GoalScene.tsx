import { motion, useReducedMotion } from 'framer-motion';
import { type PenAim } from '../lib/engine';

/* Coordenadas en el viewBox 100×62 del arco. */
const ZONE: Record<PenAim, { x: number; y: number }> = {
  L: { x: 24, y: 27 }, C: { x: 50, y: 24 }, R: { x: 76, y: 27 },
};
const OUT: Record<PenAim, { x: number; y: number }> = {
  L: { x: 3, y: 10 }, C: { x: 50, y: -4 }, R: { x: 97, y: 10 },
};
/* Gol con el palo ADIVINADO: la pelota lo pasa por arriba, al rincón. Si
   aterrizara en el mismo punto que el arquero, parecería un robo. */
const PAST: Record<PenAim, { x: number; y: number }> = {
  L: { x: 16, y: 15 }, C: { x: 50, y: 13 }, R: { x: 84, y: 15 },
};
const KEEPER_Y = 38;
const BALL_START = { x: 50, y: 57 };

export interface PenResolution { aim: PenAim; dive: PenAim; scored: boolean; }

interface Props {
  res: PenResolution | null;   // último penal resuelto (null = arco en reposo)
  showAnim: boolean;           // anima pelota/arquero y muestra el cartel
  keeperYou: boolean;          // el arquero es el TUYO (dorado) vs rival (tinte)
  resultText: string;
  resultGood: boolean;
  animKey: string | number;    // re-dispara la animación por penal
}

/* Escena del arco compartida entre la tanda y el penal en jugada.
   Presentación pura: recibe un resultado ya decidido y lo dramatiza. */
export function GoalScene({ res, showAnim, keeperYou, resultText, resultGood, animKey }: Props) {
  const reduce = useReducedMotion();

  const ballTo = res
    ? res.scored
      ? (res.dive === res.aim ? PAST[res.aim] : ZONE[res.aim])
      : res.dive === res.aim
        ? { x: ZONE[res.dive].x, y: KEEPER_Y - 4 }   // atajada: muere en el arquero
        : OUT[res.aim]                                // errado: se va afuera
    : BALL_START;

  return (
    <div className="goalbox">
      <svg className="goal" viewBox="0 0 100 62" aria-hidden="true">
        <defs>
          <pattern id="net" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
            <path d="M0 0H3.4M0 0V3.4" className="net-line" />
          </pattern>
        </defs>
        <rect x="9" y="9" width="82" height="44" fill="url(#net)" />
        <path d="M9 53 V9 H91 V53" className="goal-frame" />
        <line x1="0" y1="53" x2="100" y2="53" className="goal-ground" />

        <motion.g
          className={`keeper ${showAnim && keeperYou ? 'keeper--you' : ''}`}
          initial={false}
          animate={
            showAnim && res
              ? { x: ZONE[res.dive].x - 50, y: -5, rotate: reduce ? 0 : res.dive === 'L' ? -18 : res.dive === 'R' ? 18 : 0 }
              : { x: 0, y: 0, rotate: 0 }
          }
          transition={{ type: 'spring', stiffness: 220, damping: 17 }}
        >
          <circle cx="50" cy={KEEPER_Y - 6.5} r="3" />
          <rect x="46.4" y={KEEPER_Y - 3.5} width="7.2" height="12" rx="3" />
        </motion.g>

        {showAnim && res && (
          <motion.circle
            key={animKey}
            className="pen-ball"
            r="2.6"
            initial={{ cx: BALL_START.x, cy: BALL_START.y, scale: 1 }}
            animate={{ cx: ballTo.x, cy: ballTo.y, scale: 0.82 }}
            transition={reduce ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
          />
        )}
      </svg>

      {showAnim && res && resultText && (
        <motion.p
          key={`r${animKey}`}
          className={`pen-result ${resultGood ? 'pen-result--goal' : 'pen-result--miss'}`}
          initial={reduce ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.5, type: 'spring', stiffness: 300, damping: 18 }}
        >
          {resultText}
        </motion.p>
      )}
    </div>
  );
}