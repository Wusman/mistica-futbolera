import { motion } from 'framer-motion';
import { type Team } from '../data/players';
import { type Campaign, type Stage, type MatchView, LADDER, isGroup } from '../lib/tournament';
import { scaledRivalOf } from '../lib/engine';
import { flavor, type Cat } from '../messages';
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
  g1: 'out_g',
  g2: 'out_g',
  r16: 'out_r16',
  qf: 'out_qf',
  sf: 'out_sf',
  final: 'out_final',
};

/* ── Card "vida": entrada escalonada ── */
const cardV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const riseIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

/* Cláusula de avance: nombra la ronda a la que pasás (solo eliminación). */
function advanceTo(stage: Stage): string {
  if (stage === 'r16') return 'A Cuartos.';
  if (stage === 'qf') return 'A Semifinal.';
  if (stage === 'sf') return '¡A la FINAL!';
  return '';
}

/* Categoría de grupo (puntos): victoria por margen, empate o derrota. */
function groupVerdictCat(m: MatchView): Cat {
  if (m.outcome === 'D') return 'draw';
  const d = m.gf - m.ga;
  if (m.outcome === 'L') return d <= -3 ? 'loss_heavy' : 'loss';
  return d >= 4 ? 'win_rout' : d >= 2 ? 'win_clear' : 'win_narrow';
}

/* Frase situacional de la card de partido (no terminal). */
function verdictLine(m: MatchView, stage: Stage, idx: number): string {
  if (isGroup(stage)) return flavor(groupVerdictCat(m), idx);
  // Eliminación que avanza: penales o triunfo, + a qué ronda pasás.
  const d = m.gf - m.ga;
  const koCat: Cat = m.pens ? 'pens_win' : d >= 4 ? 'ko_rout' : d >= 2 ? 'ko_clear' : 'ko_narrow';
  return `${flavor(koCat, idx)} ${advanceTo(stage)}`.trim();
}

function topScorer(goals: Record<string, number>): string {
  const e = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];
  return e ? `${e[0]} (${e[1]})` : '—';
}

export function TournamentStep({ campaign: c, stageLabel, xiAvg, opp, onKickoff, onNext, onReset }: Props) {
  const s = c.stats;
  const stage = LADDER[c.stageIdx];

  /* ── Campaign over (eliminated or champion) — shows the deciding scoreline ── */
  if (c.sub.k === 'fulltime' && c.done) {
    const m = c.sub.m;
    const champ = c.done.champion;
    const idx = s.gf * 13 + s.ga * 7 + c.stageIdx * 5;
    const headline = champ ? flavor('champion', idx) : flavor(OUT_CAT[c.done.stage], idx);
    return (
      <motion.section className={`card ${champ ? 'card--perfect' : 'card--out'}`} variants={cardV} initial="hidden" animate="show">
        <motion.p className="card-club" variants={riseIn}>{champ ? 'Mística Futbolera' : stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <span className="score">{m.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{m.ga}</span>
        </motion.div>
        <motion.p className="vs" variants={riseIn}>Tu once vs {m.oppName} · {m.oppEdition}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>Penales {m.pens.you}–{m.pens.opp}</motion.p>}
        <motion.p className={champ ? 'perfect-tag' : 'verdict verdict--out'} variants={riseIn}>{headline}</motion.p>
        <motion.div className="scorers" variants={riseIn}>
          <h3 className="scorers-title">Tu campaña</h3>
          <ul>
            <li>Partidos: {s.pj} · {s.w}G {s.d}E {s.l}P</li>
            <li>Goles: {s.gf} a favor, {s.ga} en contra</li>
            <li>Vallas invictas: {s.cs}</li>
            <li>Goleador: {topScorer(s.goals)}</li>
          </ul>
        </motion.div>
        <motion.button className="cta" variants={riseIn} {...tap} onClick={onReset}>Jugar de nuevo</motion.button>
      </motion.section>
    );
  }

  /* ── Full-time of a non-terminal match (advance) ── */
  if (c.sub.k === 'fulltime') {
    const m = c.sub.m;
    const label = m.outcome === 'W' ? 'Victoria' : m.outcome === 'L' ? 'Derrota' : 'Empate';
    const line = verdictLine(m, stage, m.gf * 31 + m.ga * 17 + c.stageIdx * 7);
    const lost = m.outcome === 'L';
    return (
      <motion.section className={`card ${lost ? 'card--out' : ''}`} variants={cardV} initial="hidden" animate="show">
        <motion.p className="card-club" variants={riseIn}>{stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <span className="score">{m.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{m.ga}</span>
        </motion.div>
        <motion.p className="vs" variants={riseIn}>Tu once vs {m.oppName} · {m.oppEdition}</motion.p>
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>Penales {m.pens.you}–{m.pens.opp}</motion.p>}
        <motion.p className={`verdict ${lost ? 'verdict--out' : ''}`} variants={riseIn}>{label}</motion.p>
        <motion.p className="flavor-line" variants={riseIn}>{line}</motion.p>
        {m.scorers.length > 0 && (
          <motion.div className="scorers" variants={riseIn}>
            <h3 className="scorers-title">Tus goles</h3>
            <ul>{m.scorers.map((sc, k) => <li key={k}>{sc.n}</li>)}</ul>
          </motion.div>
        )}
        <motion.button className="cta" variants={riseIn} {...tap} onClick={onNext}>Siguiente ronda</motion.button>
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
  const tension = flavor(tensionCat, xiAvg * 13 + r.overall * 7 + c.stageIdx * 5);
  const record = `PJ ${s.pj} · ${s.w}G ${s.d}E ${s.l}P · GF ${s.gf} GA ${s.ga}`;

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