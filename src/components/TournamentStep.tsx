import { motion } from 'framer-motion';
import { type Team } from '../data/players';
import { type Campaign, type Stage, type MatchView, LADDER, isGroup } from '../lib/tournament';
import { scaledRivalOf } from '../lib/engine';
import { flavor, type Cat } from '../messages';
import { useT, useLocale } from '../i18n';
import { RivalReveal } from './RivalReveal';

interface Props {
  campaign: Campaign;
  stageLabel: string;
  xiAvg: number;
  opp: Team;
  onKickoff: () => void;
  onNext: () => void;
  onReset: () => void;
}

const OUT_CAT: Record<Stage, Cat> = {
  g1: 'out_g', g2: 'out_g', r16: 'out_r16', qf: 'out_qf', sf: 'out_sf', final: 'out_final',
};

const cardV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const riseIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

function groupVerdictCat(m: MatchView): Cat {
  if (m.outcome === 'D') return 'draw';
  const d = m.gf - m.ga;
  if (m.outcome === 'L') return d <= -3 ? 'loss_heavy' : 'loss';
  return d >= 4 ? 'win_rout' : d >= 2 ? 'win_clear' : 'win_narrow';
}

function topScorer(goals: Record<string, number>): string {
  const e = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];
  return e ? `${e[0]} (${e[1]})` : '—';
}

export function TournamentStep({ campaign: c, stageLabel, xiAvg, opp, onKickoff, onNext, onReset }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const s = c.stats;
  const stage = LADDER[c.stageIdx];

  const record = t('stats.record', { pj: s.pj, w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga });

  /* ── Campaign over (eliminated or champion) — shows the deciding scoreline ── */
  if (c.sub.k === 'fulltime' && c.done) {
    const m = c.sub.m;
    const champ = c.done.champion;
    const idx = s.gf * 13 + s.ga * 7 + c.stageIdx * 5;
    const headline = champ ? flavor('champion', idx, locale) : flavor(OUT_CAT[c.done.stage], idx, locale);
    return (
      <motion.section className={`card ${champ ? 'card--perfect' : 'card--out'}`} variants={cardV} initial="hidden" animate="show">
        <motion.p className="card-club" variants={riseIn}>{champ ? 'Mística Futbolera' : stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <span className="score">{m.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{m.ga}</span>
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={champ ? 'perfect-tag' : 'verdict verdict--out'} variants={riseIn}>{headline}</motion.p>
        <motion.div className="scorers" variants={riseIn}>
          <h3 className="scorers-title">{t('card.campaign')}</h3>
          <ul>
            <li>{t('stats.played')}: {s.pj} · {s.w}{t('rec.w')} {s.d}{t('rec.d')} {s.l}{t('rec.l')}</li>
            <li>{t('stats.goals', { gf: s.gf, ga: s.ga })}</li>
            <li>{t('stats.cs')}: {s.cs}</li>
            <li>{t('stats.topScorer')}: {topScorer(s.goals)}</li>
          </ul>
        </motion.div>
        <motion.button className="cta" variants={riseIn} {...tap} onClick={onReset}>{t('card.again')}</motion.button>
      </motion.section>
    );
  }

  /* ── Full-time of a non-terminal match (advance) ── */
  if (c.sub.k === 'fulltime') {
    const m = c.sub.m;
    const label = t(`result.${m.outcome}`);
    const idx = m.gf * 31 + m.ga * 17 + c.stageIdx * 7;
    let line: string;
    if (isGroup(stage)) {
      line = flavor(groupVerdictCat(m), idx, locale);
    } else {
      const d = m.gf - m.ga;
      const koCat: Cat = m.pens ? 'pens_win' : d >= 4 ? 'ko_rout' : d >= 2 ? 'ko_clear' : 'ko_narrow';
      line = `${flavor(koCat, idx, locale)} ${t('advance.' + stage)}`.trim();
    }
    const lost = m.outcome === 'L';
    return (
      <motion.section className={`card ${lost ? 'card--out' : ''}`} variants={cardV} initial="hidden" animate="show">
        <motion.p className="card-club" variants={riseIn}>{stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <span className="score">{m.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{m.ga}</span>
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={`verdict ${lost ? 'verdict--out' : ''}`} variants={riseIn}>{label}</motion.p>
        <motion.p className="flavor-line" variants={riseIn}>{line}</motion.p>
        {m.scorers.length > 0 && (
          <motion.div className="scorers" variants={riseIn}>
            <h3 className="scorers-title">{t('card.yourGoals')}</h3>
            <ul>{m.scorers.map((sc, k) => <li key={k}>{sc.n}</li>)}</ul>
          </motion.div>
        )}
        <motion.button className="cta" variants={riseIn} {...tap} onClick={onNext}>{t('card.nextRound')}</motion.button>
      </motion.section>
    );
  }

  /* ── Preview / scouting before kickoff ── */
  const r = scaledRivalOf(opp, c.stageIdx);
  const inGroup = isGroup(stage);
  const gap = xiAvg - r.overall;
  const mustWin = stage === 'g2' && c.groupPts < 3;
  const tensionCat: Cat = mustWin
    ? 'group_must_win'
    : gap >= 5 ? 'scout_fav' : gap <= -5 ? 'scout_dog' : 'scout_even';
  const tension = flavor(tensionCat, xiAvg * 13 + r.overall * 7 + c.stageIdx * 5, locale);

  return (
    <section className="match">
      <p className="match-tag">{stageLabel}</p>
      <p className="tour-record">{record}</p>

      <RivalReveal
        key={`${c.stageIdx}:${c.oppId}`}
        rival={r}
        colors={opp.colors}
        inGroup={inGroup}
        groupPts={c.groupPts}
        xiAvg={xiAvg}
        tension={tension}
        onKickoff={onKickoff}
      />
    </section>
  );
}