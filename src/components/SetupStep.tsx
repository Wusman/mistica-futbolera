import { motion } from 'framer-motion';
import { FORMATIONS, type FormationName } from '../data/players';
import { posLabel } from '../labels';
import { useT, useLocale } from '../i18n';

interface Props {
  formation: FormationName;
  seed: number;
  onFormation: (f: FormationName) => void;
  onNewSeed: () => void;
  onStart: () => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };
const pitchC = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const slotV = { hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

export function SetupStep({ formation, seed, onFormation, onNewSeed, onStart }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const names = Object.keys(FORMATIONS) as FormationName[];
  const slots = FORMATIONS[formation].slots;

  const howto = [1, 2, 3].map((n) => ({ n: `0${n}`, t: t(`howto.${n}.t`), d: t(`howto.${n}.d`) }));

  return (
    <motion.section className="setup" variants={container} initial="hidden" animate="show">
      <motion.div className="setup-main" variants={rise}>
        <div className="panel setup-side">
          <h2 className="step-title">1 · {t('setup.formation')}</h2>
          <div className="formation-grid">
            {names.map((name) => (
              <motion.button
                key={name}
                className={`chip ${name === formation ? 'chip--on' : ''}`}
                {...tap}
                onClick={() => onFormation(name)}
              >
                {name}
              </motion.button>
            ))}
          </div>

          <h2 className="step-title">2 · {t('setup.seed')}</h2>
          <div className="seed-row">
            <code className="seed-pill">{seed.toString(36)}</code>
            <motion.button className="cta cta--ghost" {...tap} onClick={onNewSeed}>
              {t('setup.new')}
            </motion.button>
          </div>

          <motion.button className="cta cta--xl" {...tap} onClick={onStart}>
            {t('setup.start')}
          </motion.button>
        </div>

        <div className="panel setup-board">
          <motion.div className="pitch" variants={pitchC}>
            {slots.map((slot, i) => (
              <motion.div
                key={i}
                className="pslot pslot--empty"
                style={{ left: `${slot.x}%`, top: `${slot.y}%`, x: '-50%', y: '-50%' }}
                variants={slotV}
              >
                <span className="pslot-pos">{posLabel(slot.pos, locale)}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.ol className="howto" variants={rise}>
        {howto.map((h) => (
          <li key={h.n}>
            <span className="howto-n">{h.n}</span>
            <span className="howto-txt">
              <b>{h.t}</b>
              <small>{h.d}</small>
            </span>
          </li>
        ))}
      </motion.ol>

      <motion.p className="setup-stats" variants={rise}>
        {t('setup.stats')}
      </motion.p>
    </motion.section>
  );
}