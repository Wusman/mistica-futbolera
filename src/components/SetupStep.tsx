import { useState } from 'react';
import { motion } from 'framer-motion';
import { FORMATIONS, type FormationName } from '../data/players';
import { posLabel } from '../labels';
import { showcaseXI, seedFromInput, shortName } from '../lib/engine';
import { useT, useLocale } from '../i18n';
import { PitchMarkings } from './PitchMarkings';
import { ChampionsBoard } from './ChampionsBoard';
import { loadStreak } from '../lib/daily';

interface Props {
  formation: FormationName;
  seed: number;
  onFormation: (f: FormationName) => void;
  onNewSeed: () => void;
  onSetSeed: (seed: number) => void;
  onStart: () => void;
  onPlaySeed: (seed: number) => void;
  onDaily: () => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } } };
const pitchC = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const slotV = { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

export function SetupStep({ formation, seed, onFormation, onNewSeed, onSetSeed, onStart, onPlaySeed, onDaily }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const names = Object.keys(FORMATIONS) as FormationName[];
  const slots = FORMATIONS[formation].slots;

  /* Eye-candy XI from the engine: deterministic per (seed, formation). */
  const xi = showcaseXI(seed, formation);

  /* Semilla editable: escribí la de un amigo (o cualquier palabra) y jugás
     SU torneo. Sincronizada con la prop vía prop-change-in-render. */
  const [seedText, setSeedText] = useState(seed.toString(36));
  const [prevSeed, setPrevSeed] = useState(seed);
  if (prevSeed !== seed) {
    setPrevSeed(seed);
    setSeedText(seed.toString(36));
  }
  const commitSeed = () => {
    const n = seedFromInput(seedText);
    if (n === null || n === seed) {
      setSeedText(seed.toString(36));
      return;
    }
    onSetSeed(n);
  };

  /* Lo que esté escrito se aplica y se juega: cero "apretá Enter primero". */
  const playSeed = () => {
    onPlaySeed(seedFromInput(seedText) ?? seed);
  };

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
          {/* El diario manda: es el hábito y la competencia. El libre acompaña. */}
          <motion.button
            className="cta cta--xl cta--hero"
            {...tap}
            onClick={onDaily}
            title={t('home.dailyHint')}
          >
            🏆 {t('home.daily')} →
          </motion.button>
          <motion.button className="cta cta--ghost cta--daily" {...tap} onClick={onStart}>
            {t('daily.free')}
          </motion.button>
          {(() => {
            const meta = loadStreak();
            if (!meta || (meta.streak < 2 && meta.titles === 0)) return null;
            return (
              <p className="streak-chip">
                {meta.streak >= 2 && <span>🔥 {t('streak.days', { n: meta.streak })}</span>}
                {meta.titles > 0 && <span>🏆 {t('streak.titles', { n: meta.titles })}</span>}
              </p>
            );
          })()}
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
            <PitchMarkings />
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
                      <span className="pslot-name">{shortName(p.n)}</span>
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

          {/* ── Seed: discreta pero editable — pegá la de un amigo y jugá SU torneo. ── */}
          <div className="seed-mini">
            <input
              className="seed-chip"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              onBlur={commitSeed}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              aria-label={t('setup.seed')}
              spellCheck={false}
              autoComplete="off"
              maxLength={24}
            />
            <motion.button className="btn-mini" {...tap} onClick={onNewSeed}>
              {t('setup.new')}
            </motion.button>
            <motion.button className={`btn-mini ${copied ? 'btn-mini--ok' : ''}`} {...tap} onClick={copySeed}>
              {copied ? t('home.copied') : t('home.copy')}
            </motion.button>
          </div>
          <motion.button className="cta cta--seed" {...tap} onClick={playSeed}>
            ▶ {t('home.playSeed')}
          </motion.button>
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

      <motion.div variants={rise}>
        <ChampionsBoard />
      </motion.div>

      <motion.p className="setup-stats" variants={rise}>
        {t('setup.stats')}
      </motion.p>
    </motion.section>
  );
}