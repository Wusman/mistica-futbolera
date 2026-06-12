import { motion } from 'framer-motion';
import { type DailyRecord, loadStreak } from '../lib/daily';
import { useT } from '../i18n';
import { ChampionsBoard } from './ChampionsBoard';

interface Props {
  rec: DailyRecord;
  onFree: () => void;
}

/* "Ya jugaste hoy": resumen del intento del día + tabla + salida al modo
   libre. El torneo diario es UN intento; mañana hay semilla nueva. */
export function DailyDone({ rec, onFree }: Props) {
  const t = useT();
  return (
    <motion.section
      className="match"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <p className="match-tag">{t('daily.played')}</p>

      <div className={`card ${rec.champion ? 'card--perfect' : 'card--out'}`}>
        <p className="card-club">{rec.champion ? t('daily.champ') : t('stage.' + rec.stage)}</p>
        <div className="scoreline">
          <span className="score">{rec.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{rec.ga}</span>
        </div>
        <p className="vs">{t('card.vs', { opp: rec.opp })}</p>
        <p className="tour-record">
          {t('stats.record', { pj: rec.stats.w + rec.stats.d + rec.stats.l, w: rec.stats.w, d: rec.stats.d, l: rec.stats.l, gf: rec.stats.gf, ga: rec.stats.ga })}
        </p>
        {rec.name && <p className="seed-hint">{t('daily.submitted')}</p>}
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
        <p className="match-note">{t('daily.back')}</p>
      </div>

      <ChampionsBoard />

      <motion.button className="cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onFree}>
        {t('daily.free')}
      </motion.button>
    </motion.section>
  );
}