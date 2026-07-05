import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FORMATIONS, type FormationName, type Pos } from '../data/players';
import { posLabel } from '../labels';
import { showcaseXI, seedFromInput, shortName, mulberry32 } from '../lib/engine';
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
/* Apertura broadcast: la ficha del día entra como lower third, de izquierda
   a derecha, DESPUÉS de que estampa el título. Presentación pura. */
const lowerThird = {
  hidden: { opacity: 0, x: -36 },
  show: { opacity: 1, x: 0, transition: { delay: 0.4, type: 'spring' as const, stiffness: 260, damping: 26 } },
};
const pitchC = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const slotV = { hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

/* Fecha localizada para la ficha del día ("VIE" / "03 JUL"). UI pura: el
   core jamás la ve; el daily ya elige su semilla por fecha en la shell. */
function fixtureDate(locale: string): { day: string; num: string } {
  const parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: 'short' }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { day: get('weekday').replace('.', ''), num: `${get('day')} ${get('month').replace('.', '')}` };
}

/* ── La jugada de pizarra ── GK → defensa → medio → medio → ataque, elegida
   determinísticamente de la semilla (mulberry32 con sal propia: no comparte
   stream con nada del core). Presentación pura: dibuja, no decide. */
const DEF = new Set<Pos>(['RB', 'CB', 'LB']);
const MID = new Set<Pos>(['DM', 'CM', 'AM', 'RM', 'LM']);
function boardPlay(seed: number, formation: FormationName, nth: number): { x: number; y: number }[] {
  const slots = FORMATIONS[formation].slots;
  const rng = mulberry32(((seed ^ 0x5eba11) + nth * 0x9e3779b9) >>> 0);
  const idxs = (test: (p: Pos) => boolean) =>
    slots.map((sl, i) => (test(sl.pos) ? i : -1)).filter((i) => i >= 0);
  const pick = (arr: number[]) => arr[Math.floor(rng() * arr.length)];
  const gk = idxs((p) => p === 'GK');
  const df = idxs((p) => DEF.has(p));
  const md = idxs((p) => MID.has(p));
  const fw = idxs((p) => p !== 'GK' && !DEF.has(p) && !MID.has(p));
  const m1 = pick(md.length ? md : df);
  const rest = md.filter((i) => i !== m1);
  const m2 = pick(rest.length ? rest : md.length ? md : df);
  const path = [pick(gk), pick(df.length ? df : md), m1, m2, pick(fw.length ? fw : md)];
  return path.map((i) => ({ x: slots[i].x, y: slots[i].y }));
}

export function SetupStep({ formation, seed, onFormation, onNewSeed, onSetSeed, onStart, onPlaySeed, onDaily }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const names = Object.keys(FORMATIONS) as FormationName[];
  const slots = FORMATIONS[formation].slots;

  /* Eye-candy XI from the engine: deterministic per (seed, formation). */
  const xi = showcaseXI(seed, formation);

  /* Semilla editable: escribí la de un amigo (o cualquier palabra) y jugás
     SU torneo. Sincronizada con la prop vía prop-change-in-render. */
  const [playNth, setPlayNth] = useState(0);
  const [seedText, setSeedText] = useState(seed.toString(36));
  const [prevSeed, setPrevSeed] = useState(seed);
  if (prevSeed !== seed) {
    setPrevSeed(seed);
    setSeedText(seed.toString(36));
    setPlayNth(0); // semilla nueva = pizarra nueva: la jugada espera al once
  }
  /* Cambio de formación: la cancha remonta y las burbujas re-entran; la
     jugada vuelve a "primera" para esperar al once (si no, corría con
     delay de tap sobre una cancha todavía vacía y parecía rota). */
  const [prevFormation, setPrevFormation] = useState(formation);
  if (prevFormation !== formation) {
    setPrevFormation(formation);
    setPlayNth(0);
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

  /* Cómo se juega = minutos de partido: 01' drafteás, 45' competís, 90' desafiás. */
  const MINS = ['01', '45', '90'];
  const howto = [1, 2, 3].map((n) => ({ n: MINS[n - 1], t: t(`howto.${n}.t`), d: t(`howto.${n}.d`) }));
  const fx = fixtureDate(locale);
  const reduce = useReducedMotion();
  /* Tap en la pizarra = otra jugada. nth entra a la sal del rng: cada tap es
     una jugada distinta pero reproducible (misma semilla + mismos taps →
     mismas jugadas). Presentación pura. */
  const play = boardPlay(seed, formation, playNth);

  return (
    <motion.section className="setup" variants={container} initial="hidden" animate="show">
      <div className="hero">
        {/* ── Promise first: título-estampa + plaqueta chyron + la ficha del día. ── */}
        <motion.div className="hero-copy" variants={rise}>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h2 className="hero-title">{t('home.h1')}</h2>
          <p className="hero-plaque">{t('tagline')}</p>
          <p className="hero-sub">{t('home.sub')}</p>
          {/* El diario manda: es el hábito y la competencia. Entra como
              lower third de transmisión, con la fecha de HOY en la celda. */}
          <motion.button
            className="fixture"
            variants={lowerThird}
            {...tap}
            onClick={onDaily}
          >
            <span className="fx-date">
              <span className="fx-day">{fx.day}</span>
              <span className="fx-num">{fx.num}</span>
            </span>
            <span className="fx-main">
              <span className="fx-label">{t('home.daily')}</span>
              <span className="fx-meta">{t('home.dailyHint')}</span>
            </span>
            <span className="fx-arrow" aria-hidden="true">→</span>
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
          <div className="board-head">
            <span><b>{formation}</b></span>
            <span>#{seed.toString(36).toUpperCase()}</span>
          </div>
          <motion.div
            className="pitch"
            key={`${seed.toString(36)}:${formation}`}
            variants={pitchC}
            initial="hidden"
            animate="show"
            onClick={() => setPlayNth((n) => n + 1)}
          >
            <PitchMarkings />
            {!reduce && (() => {
              const delay = playNth === 0 ? 0.95 : 0.12; // al cargar espera al once; al tap sale ya
              const run = 1.9;
              return (
                <motion.svg
                  key={`play-${playNth}`}
                  className="play"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: [1, 1, 0] }}
                  transition={{ delay, duration: run + 0.6, times: [0, 0.78, 1] }}
                >
                  <motion.path
                    className="play-line"
                    d={`M ${play.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay, duration: run, ease: 'easeInOut' }}
                  />
                  <motion.circle
                    className="play-ball"
                    r="2.3"
                    initial={{ cx: play[0].x, cy: play[0].y, opacity: 0 }}
                    animate={{ cx: play.map((p) => p.x), cy: play.map((p) => p.y), opacity: 1 }}
                    transition={{
                      delay, duration: run, times: [0, 0.3, 0.55, 0.78, 1],
                      ease: ['easeOut', 'easeOut', 'easeOut', 'easeOut'],
                      opacity: { delay: Math.max(delay - 0.2, 0), duration: 0.2 },
                    }}
                  />
                </motion.svg>
              );
            })()}
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
        <motion.div className="hero-controls" variants={rise}>
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
            <span className="howto-n">{h.n}<small>’</small></span>
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