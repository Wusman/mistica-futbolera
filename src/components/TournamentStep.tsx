import { useEffect, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { type Team } from '../data/players';
import { type Campaign, type Stage, type MatchView, LADDER, isGroup } from '../lib/tournament';
import { scaledRivalOf } from '../lib/engine';
import { flavor, type Cat } from '../messages';
import { useT, useLocale } from '../i18n';
import { RivalReveal } from './RivalReveal';
import { MatchTicker } from './MatchTicker';

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

/* Marcador que "cuenta" hasta el resultado (presentación pura; instantáneo
   con movimiento reducido). El número real ya está decidido por el engine. */
function CountScore({ n, away }: { n: number; away?: boolean }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? n : 0);
  useEffect(() => {
    if (reduce) { setV(n); return; }
    const c = animate(0, n, { duration: 0.55, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [n, reduce]);
  return <span className={`score ${away ? 'score--away' : ''}`}>{v}</span>;
}

/* Franja superior con los colores del rival: cada tarjeta "es" del partido. */
function ClubStripe({ colors }: { colors: string[] }) {
  return (
    <div className="card-stripe" aria-hidden="true">
      {colors.map((c, k) => <span key={k} style={{ background: c }} />)}
    </div>
  );
}

/* Tus goles con minuto (del relato): "23' Benzema" pega más que una lista. */
function GoalsWithMinutes({ m, title }: { m: MatchView; title: string }) {
  const yours = m.ev.filter((e) => e.side === 'you');
  if (yours.length === 0) return null;
  return (
    <motion.div className="scorers" variants={riseIn}>
      <h3 className="scorers-title">{title}</h3>
      <ul className="goals-min">
        {yours.map((e, k) => (
          <li key={k}><span className="gm-min">{e.min}&rsquo;</span> {e.n}</li>
        ))}
      </ul>
    </motion.div>
  );
}

export function TournamentStep({ campaign: c, stageLabel, xiAvg, opp, onKickoff, onNext, onReset }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const s = c.stats;
  const stage = LADDER[c.stageIdx];

  /* Relato del segundo tiempo: corre 45' → 90' antes de mostrar el veredicto.
     Se rearma al cambiar de etapa (prop-change-in-render). Si el partido fue
     a penales, el relato ya corrió en la tanda y no se repite. */
  const [live2, setLive2] = useState(true);
  const [prevIdx, setPrevIdx] = useState(c.stageIdx);
  if (prevIdx !== c.stageIdx) {
    setPrevIdx(c.stageIdx);
    setLive2(true);
  }

  const record = t('stats.record', { pj: s.pj, w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga });

  if (c.sub.k === 'fulltime' && live2 && !c.sub.m.pens) {
    const m = c.sub.m;
    return (
      <section className="match">
        <p className="match-tag">{stageLabel}</p>
        <MatchTicker
          from={45}
          to={90}
          events={m.ev.filter((e) => e.min > 45)}
          baseGf={m.ev.filter((e) => e.min <= 45 && e.side === 'you').length}
          baseGa={m.ev.filter((e) => e.min <= 45 && e.side === 'opp').length}
          oppName={m.oppName}
          halfLabel={t('ticker.second')}
          endLabel={t('ticker.ft')}
          duration={isGroup(stage) ? 4.2 : 5.4}
          onDone={() => setLive2(false)}
        />
      </section>
    );
  }

  /* ── Campaign over (eliminated or champion) — shows the deciding scoreline ── */
  if (c.sub.k === 'fulltime' && c.done) {
    const m = c.sub.m;
    const champ = c.done.champion;
    const idx = s.gf * 13 + s.ga * 7 + c.stageIdx * 5;
    const headline = champ ? flavor('champion', idx, locale) : flavor(OUT_CAT[c.done.stage], idx, locale);
    return (
      <motion.section className={`card ${champ ? 'card--perfect' : 'card--out'}`} variants={cardV} initial="hidden" animate="show">
        <ClubStripe colors={opp.colors} />
        <motion.p className="card-club" variants={riseIn}>{champ ? 'Mística Futbolera' : stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <CountScore n={m.gf} />
          <span className="score-sep">–</span>
          <CountScore n={m.ga} away />
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={`outcome ${champ ? 'outcome--win' : 'outcome--lose'}`} variants={riseIn}>{headline}</motion.p>
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
        <ClubStripe colors={opp.colors} />
        <motion.p className="card-club" variants={riseIn}>{stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <CountScore n={m.gf} />
          <span className="score-sep">–</span>
          <CountScore n={m.ga} away />
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={`outcome ${lost ? 'outcome--lose' : 'outcome--win'}`} variants={riseIn}>{t(`result.${m.outcome}`)}</motion.p>
        <motion.p className="flavor-line" variants={riseIn}>{line}</motion.p>
        <GoalsWithMinutes m={m} title={t('card.yourGoals')} />
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