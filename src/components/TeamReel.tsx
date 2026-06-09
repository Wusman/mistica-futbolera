import { useEffect } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion';
import { type Team } from '../data/players';

interface Props {
  teams: Team[];      // pool to flash through
  target: Team;       // the team it MUST land on (already decided by the seed)
  spinKey: string;    // change this to retrigger a spin (e.g. `${seed}:${step}`)
  label?: string;
  onDone: () => void; // fired when the reel settles
}

const STRIP = 16; // filler cells before the landing cell

/* Pure presentation. The landing team is decided elsewhere (draftTeamAt /
   pickOpponent); the reel only animates cycling and stops on it. No runtime
   randomness, so it never touches determinism or the share-code. */
export function TeamReel({ teams, target, spinKey, label = 'Sorteando…', onDone }: Props) {
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const idx = useTransform(pos, (p) => -p * 100);
  const x = useMotionTemplate`${idx}%`;

  const cells: Team[] = [];
  for (let k = 0; k < STRIP; k++) cells.push(teams[k % teams.length]);
  cells.push(target);
  const finalIndex = cells.length - 1;

  useEffect(() => {
    pos.set(0);
    if (reduce) {
      pos.set(finalIndex);
      onDone();
      return;
    }
    const controls = animate(pos, finalIndex, {
      duration: 1.7,
      ease: [0.08, 0.62, 0.04, 1], // strong deceleration into the landing
    });
    controls.then(() => onDone());
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  return (
    <div className="reel">
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
    </div>
  );
}