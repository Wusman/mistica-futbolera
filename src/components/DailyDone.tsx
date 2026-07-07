import { motion } from 'framer-motion';
import { type DailyRecord, loadStreak } from '../lib/daily';
import { useT } from '../i18n';
import { ChampionsBoard } from './ChampionsBoard';
import { Emblem } from './Emblem';
import { YOU_EMBLEM } from '../config';

interface Props {
  rec: DailyRecord;
  onFree: () => void;
}

/* "Ya jugaste hoy": resumen del intento del día + tabla + salida al modo
   libre. El torneo diario es UN intento; mañana hay semilla nueva. */
export function DailyDone({ rec, onFree }: Props) {
  const t = useT();
  const st = rec.stats;
  const pj = st.w + st.d + st.l;
  const diff = st.gf - st.ga;
  const meta = loadStreak();
  const showStreak = !!meta && (meta.streak >= 2 || meta.titles > 0);

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

        <div className="duel">
          <Emblem colors={YOU_EMBLEM} size={46} className="emb" />
          <div className="scoreline">
            <span className="score">{rec.gf}</span>
            <span className="score-sep">–</span>
            <span className="score score--away">{rec.ga}</span>
          </div>
          <Emblem colors={rec.colors ?? []} size={46} className="emb" />
        </div>

        <p className="vs">{t('card.vs', { opp: rec.opp })}</p>

        <div className="stat-grid stat-grid--3">
          <div className="stat">
            <span className="stat-v">{pj}</span>
            <span className="stat-l">{t('stats.played')}</span>
          </div>
          <div className="stat">
            <span className="stat-v">{st.w}·{st.d}·{st.l}</span>
            <span className="stat-l">{t('rec.w')}·{t('rec.d')}·{t('rec.l')}</span>
          </div>
          <div className="stat" title={t('stats.goals', { gf: st.gf, ga: st.ga })}>
            <span className="stat-v">
              <span className="gf-you">{st.gf}</span>
              <span className="gf-sep">:</span>
              <span className="gf-opp">{st.ga}</span>
            </span>
            <span className="stat-l">{t('stats.goalsShort')}</span>
            <span className="stat-s">{diff >= 0 ? '+' : ''}{diff}</span>
          </div>
        </div>

        {rec.name && <p className="seed-hint">{t('daily.submitted')}</p>}

        {showStreak && meta && (
          <p className="streak-chip">
            {meta.streak >= 2 && <span>{t('streak.days', { n: meta.streak })}</span>}
            {meta.titles > 0 && <span>{t('streak.titles', { n: meta.titles })}</span>}
          </p>
        )}

        <p className="match-note">{t('daily.back')}</p>
      </div>

      <ChampionsBoard />

      <motion.button className="cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onFree}>
        {t('daily.free')}
      </motion.button>
    </motion.section>
  );
}