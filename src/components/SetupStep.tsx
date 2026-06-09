import { useState } from 'react';
import { motion } from 'framer-motion';
import { FORMATIONS, type FormationName } from '../data/players';
import { posLabel } from '../labels';
import { showcaseXI } from '../lib/engine';
import { useT, useLocale } from '../i18n';

interface Props {
  formation: FormationName;
  seed: number;
  onFormation: (f: FormationName) => void;
  onNewSeed: () => void;
  onStart: () => void;
}

const surname = (name: string) => {
  const parts = name.replace(/"/g, '').split(' ');
  return parts[parts.length - 1];
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } } };
const pitchC = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const slotV = { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

export function SetupStep({ formation, seed, onFormation, onNewSeed, onStart }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const names = Object.keys(FORMATIONS) as FormationName[];
  const slots = FORMATIONS[formation].slots;

  /* Eye-candy XI from the engine: deterministic per (seed, formation). */
  const xi = showcaseXI(seed, formation);

  const [copied, setCopied] = useState(false);
  const copySeed = () => {
    navigator.clipboard?.writeText(seed.toString(36)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600); // UI-only, never touches the core
    });
  };

  const howto = [1, 2, 3].map((n) => ({ n: `0${n}`, t: t(`howto.${n}.t`), d: t(`howto.${n}.d`) }));

  return (
    <motion.section className="setup" variants={container} initial="hidden" animate="show">
      <div className="hero">
        {/* ── Promise first: headline + sub + the one obvious action. ── */}
        <motion.div className="hero-copy" variants={rise}>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h2 className="hero-title">
            {t('home.h1')}
            <span className="hero-title-gold">{t('tagline')}</span>
          </h2>
          <p className="hero-sub">{t('home.sub')}</p>
          <motion.button className="cta cta--xl cta--hero" {...tap} onClick={onStart}>
            {t('setup.start')} →
          </motion.button>
        </motion.div>

        {/* ── The carrot: a dream XI you could draft, re-rolled per seed. ── */}
        <motion.div className="hero-board panel" variants={rise}>
          <motion.div
            className="pitch"
            key={`${seed.toString(36)}:${formation}`}
            variants={pitchC}
            initial="hidden"
            animate="show"
          >
            {slots.map((slot, i) => {
              const p = xi[i];
              return (
                <motion.div
                  key={`${formation}:${i}`}
                  className={`pslot ${p ? 'pslot--filled' : 'pslot--empty'}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, x: '-50%', y: '-50%' }}
                  variants={slotV}
                >
                  {p ? (
                    <>
                      <span className="pslot-name">{surname(p.n)}</span>
                      <span className="pslot-rating">{p.r}</span>
                    </>
                  ) : (
                    <span className="pslot-pos">{posLabel(slot.pos, locale)}</span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <p className="board-caption">{t('home.showcase')}</p>

          {/* ── Seed: present but discreet. The challenge hook lives here. ── */}
          <div className="seed-mini">
            <code className="seed-chip">{seed.toString(36)}</code>
            <motion.button className="btn-mini" {...tap} onClick={onNewSeed}>
              {t('setup.new')}
            </motion.button>
            <motion.button className={`btn-mini ${copied ? 'btn-mini--ok' : ''}`} {...tap} onClick={copySeed}>
              {copied ? t('home.copied') : t('home.copy')}
            </motion.button>
          </div>
          <p className="seed-hint">{t('home.seedHint')}</p>
        </motion.div>

        {/* ── Formation: optional tuning, default already sane. ── */}
        <motion.div className="hero-controls panel" variants={rise}>
          <h2 className="step-title">{t('setup.formation')}</h2>
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
        </motion.div>
      </div>

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