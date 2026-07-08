import { motion } from 'framer-motion';
import { type DailyRecord, loadStreak } from '../lib/daily';
import { useT } from '../i18n';
import { ChampionsBoard } from './ChampionsBoard';
import { Emblem } from './Emblem';
import { YOU_EMBLEM } from '../config';
import { loadEscudo, loadTeamName, loadPattern, teamPattern } from '../lib/escudo';

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
          <Emblem colors={loadEscudo() ?? YOU_EMBLEM} pattern={loadPattern()} size={46} className="emb" />
          <div className="scoreline">
            <span className="score">{rec.gf}</span>
            <span className="score-sep">–</span>
            <span className="score score--away">{rec.ga}</span>
          </div>
          <Emblem colors={rec.colors ?? []} pattern={teamPattern(rec.colors ?? [])} size={46} className="emb" />
        </div>

        <p className="vs">{t('card.vs', { you: loadTeamName() || t('vs.you'), opp: rec.opp })}</p>

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
            {meta.streak >= 2 && (
              <span>
                <svg className="streak-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 2.2c1.4 1.9 2.8 2.9 2.8 5.2a2.8 2.8 0 0 1-5.6 0c0-1 .5-1.9 1.1-2.5.3 1 .9 1.3 1.5.8C8.3 5 8 3.3 8 2.2Z" />
                </svg>
                {t('streak.days', { n: meta.streak })}
              </span>
            )}
            {meta.titles > 0 && (
              <span>
                <svg className="streak-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 3h6v2.4a3 3 0 0 1-6 0V3Z" />
                  <path d="M5 3.6H3.6v.5A1.6 1.6 0 0 0 5 5.6" />
                  <path d="M11 3.6h1.4v.5A1.6 1.6 0 0 1 11 5.6" />
                  <path d="M8 8.4v2M6.2 11.5h3.6" />
                </svg>
                {t('streak.titles', { n: meta.titles })}
              </span>
            )}
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