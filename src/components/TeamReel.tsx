import { useEffect, useRef } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';
import { type Team } from '../data/players';

/* ── Tunables del reel del draft (ajustá a gusto) ──
   duration: segundos que dura el giro (bajalo si 11 giros se hacen largos).
   strip:    cuántos equipos pasan volando antes de frenar en el que cae.
   ease:     curva de frenado (cubic-bezier). El último número alto = frena seco. */
const SPIN = {
  duration: 1.4,
  strip: 14,
  ease: [0.08, 0.62, 0.04, 1] as const,
};

interface Props {
  teams: Team[];      // pool to flash through
  target: Team;       // the team it MUST land on (already decided by the seed)
  spinKey: string;    // change this to retrigger a spin (e.g. `${seed}:${step}`)
  label?: string;
  onDone: () => void; // fired when the reel settles (or is skipped)
}

/* Pure presentation. The landing team is decided elsewhere (draftTeamAt /
   pickOpponent); the reel only animates cycling and stops on it. No runtime
   randomness, so it never touches determinism or the share-code. */
export function TeamReel({ teams, target, spinKey, label = 'Sorteando…', onDone }: Props) {
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const idx = useTransform(pos, (p) => -p * 100);
  const x = useMotionTemplate`${idx}%`;

  const cells: Team[] = [];
  for (let k = 0; k < SPIN.strip; k++) cells.push(teams[k % teams.length]);
  cells.push(target);
  const finalIndex = cells.length - 1;

  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;
    pos.set(0);
    const finish = () => {
      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    };
    if (reduce) {
      pos.set(finalIndex);
      finish();
      return;
    }
    const controls = animate(pos, finalIndex, { duration: SPIN.duration, ease: SPIN.ease });
    controlsRef.current = controls;
    controls.then(finish);
    return () => {
      cancelled = true;
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  const skip = () => {
    if (doneRef.current) return;
    controlsRef.current?.stop();
    pos.set(finalIndex);
    doneRef.current = true;
    onDone();
  };

  return (
    <div className="reel" onClick={skip} role="button" tabIndex={0} title="Tocá para saltar">
      <p className="reel-label">{label}</p>
      <div className="reel-window">
        <motion.div className="reel-strip" style={{ x }}>
          {cells.map((t, k) => (
            <div className="reel-cell" key={k}>
              <div className="club-colors">
                {t.colors.map((c, j) => (
                  <span key={j} style={{ background: c }} />
                ))}
              </div>
              <span className="reel-name">{t.name}</span>
              <span className="reel-ed">{t.edition}</span>
            </div>
          ))}
        </motion.div>
      </div>
      <p className="reel-hint">tocá para saltar</p>
    </div>
  );
}