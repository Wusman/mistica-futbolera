import { motion } from 'framer-motion';
import { useT, useLocale } from '../i18n';
import { posLabel } from '../labels';
import { type RunResult } from '../lib/run';
import { stagesFor } from '../lib/tournament';

interface Props {
  result: RunResult | null; // null = código inválido / irreproducible
  seed: number;
  onPlaySeed: (seed: number) => void;
  onClose: () => void;
}

const cardV = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const riseIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

export function Spectator({ result, seed, onPlaySeed, onClose }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const seed36 = seed.toString(36);

  /* Código ilegible: aviso corto y salida. */
  if (!result) {
    return (
      <motion.section className="spec spec--error" variants={cardV} initial="hidden" animate="show">
        <motion.h2 className="spec-title" variants={riseIn}>{t('spec.invalidTitle')}</motion.h2>
        <motion.p className="spec-sub" variants={riseIn}>{t('spec.invalidBody')}</motion.p>
        <motion.div className="spec-ctas" variants={riseIn}>
          <motion.button className="cta" {...tap} onClick={onClose}>{t('spec.close')}</motion.button>
        </motion.div>
      </motion.section>
    );
  }

  const stages = stagesFor(result.matches);
  const s = result.stats;

  return (
    <motion.section className="spec" variants={cardV} initial="hidden" animate="show">
      <motion.p className="spec-eyebrow" variants={riseIn}>{t('spec.eyebrow')}</motion.p>
      <motion.h2 className="spec-title" variants={riseIn}>
        {result.champion ? t('spec.champion') : t('spec.outAt', { stage: t('stage.' + result.stage) })}
      </motion.h2>

      {/* El once drafteado */}
      <motion.div className="spec-block" variants={riseIn}>
        <h3 className="spec-h3">{t('spec.squad')} <span className="spec-avg">{t('spec.avg', { n: result.xiAvg })}</span></h3>
        <ul className="spec-xi">
          {result.xi.map((p) => (
            <li key={p.i} className="spec-xi-row">
              <span className="spec-pos">{posLabel(p.pos[0], locale)}</span>
              <span className="spec-name">{p.n}</span>
              <span className="spec-rat">{p.r}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* El camino, partido por partido */}
      <motion.div className="spec-block" variants={riseIn}>
        <h3 className="spec-h3">{t('spec.path')}</h3>
        <ul className="spec-path">
          {result.matches.map((m, i) => {
            const legTag = m.leg ? ` · ${t(m.leg === 1 ? 'spec.leg1' : 'spec.leg2')}` : '';
            const mine = m.scorers.filter((sc) => sc.i >= 0).map((sc) => sc.n);
            return (
              <li key={i} className={`spec-match spec-match--${m.outcome.toLowerCase()}`}>
                <div className="spec-match-top">
                  <span className="spec-stage">{t('stage.' + stages[i])}{legTag}</span>
                  <span className="spec-score">{m.gf}–{m.ga}{m.pens ? ` · ${t('card.pens', { a: m.pens.you, b: m.pens.opp })}` : ''}</span>
                </div>
                <div className="spec-match-opp">{m.oppName} · {m.oppEdition}</div>
                {mine.length > 0 && <div className="spec-match-sc">⚽ {mine.join(', ')}</div>}
              </li>
            );
          })}
        </ul>
      </motion.div>

      {/* Resumen numérico */}
      <motion.p className="spec-record" variants={riseIn}>
        {t('stats.record', { pj: s.pj, w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga })}
      </motion.p>

      <motion.div className="spec-ctas" variants={riseIn}>
        <motion.button className="cta" {...tap} onClick={() => onPlaySeed(seed)}>{t('spec.playThis')}</motion.button>
        <motion.button className="cta cta--ghost" {...tap} onClick={onClose}>{t('spec.close')}</motion.button>
      </motion.div>
      <motion.p className="spec-seedline" variants={riseIn}>{t('spec.seedLine', { seed: seed36 })}</motion.p>
    </motion.section>
  );
}