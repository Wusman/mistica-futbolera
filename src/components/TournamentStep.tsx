import { useEffect, useState } from 'react';
import { motion, animate, useReducedMotion } from 'framer-motion';
import { type Team } from '../data/players';
import { type Campaign, type Stage, type MatchView, LADDER, isGroup, isTwoLegged } from '../lib/tournament';
import { flavor, type Cat } from '../messages';
import { useT, useLocale } from '../i18n';
import { BRAND, SITE_URL } from '../config';
import { scaledRivalOf, xiProfile, evHalf, fmtMin } from '../lib/engine';
import { type DailyStats, loadDaily, saveDaily, submitChampion } from '../lib/daily';
import { RivalReveal } from './RivalReveal';
import { Bracket } from './Bracket';
import { MatchTicker } from './MatchTicker';

interface Props {
  campaign: Campaign;
  stageLabel: string;
  xiAvg: number;
  opp: Team;
  seed: number;
  mode: 'free' | 'daily';
  shareCode?: string | null;
  onKickoff: () => void;
  onNext: () => void;
  onRetry: () => void;
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

function topScorer(goals: Record<string, number>): { n: string; g: number } | null {
  const e = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];
  return e ? { n: e[0], g: e[1] } : null;
}

/* Logos inline (trazados estándar, sin dependencias). */
const IcoX = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);
const IcoWa = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);
const IcoShare = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 2.59l4.7 4.7-1.41 1.42L13 6.41V16h-2V6.41L8.71 8.71 7.3 7.29 12 2.59zM5 10v10h14V10h2v12H3V10h2z" />
  </svg>
);

/* Marcador que "cuenta" hasta el resultado (presentación pura; instantáneo
   con movimiento reducido). El número real ya está decidido por el engine. */
function CountScore({ n, away }: { n: number; away?: boolean }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (reduce) return; // con movimiento reducido el valor se deriva, sin animar
    const c = animate(0, n, { duration: 0.55, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [n, reduce]);
  return <span className={`score ${away ? 'score--away' : ''}`}>{reduce ? n : v}</span>;
}

/* Franja superior con los colores del rival: cada tarjeta "es" del partido. */
function ClubStripe({ colors }: { colors: string[] }) {
  return (
    <div className="card-stripe" aria-hidden="true">
      {colors.map((c, k) => <span key={k} style={{ background: c }} />)}
    </div>
  );
}

/* ── Ficha de partido ── la línea de tiempo de AMBOS equipos, como en un
   informe de partido de verdad: tus goles alineados a la izquierda, los del
   rival a la derecha, ordenados por minuto sobre la regla central. La
   alineación dice de quién es cada gol: cero claves de i18n nuevas. Los
   autores rivales ya vienen nombrados del engine (halfEvents + oppXI). */
function MatchTimeline({ m }: { m: MatchView }) {
  const goals = [...m.ev].sort((a, b) => a.min - b.min);
  if (goals.length === 0) return null;
  return (
    <motion.ol className="timeline" variants={riseIn}>
      {goals.map((e, k) => (
        <li key={k} className={`tl-goal ${e.side === 'you' ? 'tl-goal--you' : 'tl-goal--opp'}`}>
          <span className="tl-min">{fmtMin(e)}</span>
          <span className="tl-name">{e.n ?? m.oppName}{e.p ? ' (p)' : ''}</span>
        </li>
      ))}
    </motion.ol>
  );
}

export function TournamentStep({ campaign: c, stageLabel, xiAvg, opp, seed, mode, shareCode, onKickoff, onNext, onRetry, onReset }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const s = c.stats;
  const stage = LADDER[c.stageIdx];

  /* Relato del segundo tiempo: corre 45' → 90' antes de mostrar el veredicto.
     Se rearma al cambiar de etapa (prop-change-in-render). Si el partido fue
     a penales, el relato ya corrió en la tanda y no se repite. */
  const [live2, setLive2] = useState(true);
  const [copied, setCopied] = useState(false);
  const [arcadeName, setArcadeName] = useState('');
  const [boardState, setBoardState] = useState<'idle' | 'sending' | 'done' | 'error'>(
    () => (loadDaily()?.name ? 'done' : 'idle'),
  );
  const signBoard = () => {
    const name = arcadeName.trim();
    if (name.length < 2 || boardState === 'sending' || boardState === 'done') return;
    const stats: DailyStats = { w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga, avg: xiAvg };
    setBoardState('sending');
    submitChampion({ name, ...stats })
      .then(() => {
        const rec = loadDaily();
        if (rec) saveDaily({ ...rec, name });
        setBoardState('done');
      })
      .catch(() => setBoardState('error'));
  };
  const copySeed = () => {
    navigator.clipboard?.writeText(seed.toString(36)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600); // UI-only
    });
  };
  const [codeCopied, setCodeCopied] = useState(false);
  const copyCode = () => {
    if (!shareCode) return;
    navigator.clipboard?.writeText(shareCode).then(() => {
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600); // UI-only
    });
  };
  /* Reset del relato por PARTIDO, no por etapa: entre ida y vuelta el
     stageIdx no cambia, pero la pierna sí. */
  const matchKey = `${c.stageIdx}:${c.leg}`;
  const [prevKey, setPrevKey] = useState(matchKey);
  if (prevKey !== matchKey) {
    setPrevKey(matchKey);
    setLive2(true);
  }

  const record = t('stats.record', { pj: s.pj, w: s.w, d: s.d, l: s.l, gf: s.gf, ga: s.ga });

  if (c.sub.k === 'fulltime' && live2 && !c.sub.m.pens) {
    const m = c.sub.m;
    const resume = c.sub.resume;
    return (
      <section className="match">
        <p className="match-tag">{stageLabel}</p>
        <MatchTicker
          from={resume ?? 45}
          to={m.end2}
          events={m.ev.filter((e) => evHalf(e) === 2 && e.min >= (resume ?? 46))}
          baseGf={m.ev.filter((e) => e.side === 'you' && (evHalf(e) === 1 || e.min < (resume ?? 46))).length}
          baseGa={m.ev.filter((e) => e.side === 'opp' && (evHalf(e) === 1 || e.min < (resume ?? 46))).length}
          oppName={m.oppName}
          halfLabel={t('ticker.second')}
          endLabel={t('ticker.ft')}
          duration={(isGroup(stage) ? 4.2 : 5.4) * ((m.end2 - (resume ?? 45)) / (m.end2 - 45))}
          onDone={() => setLive2(false)}
        />
      </section>
    );
  }

  /* ── Campaign over (eliminated or champion) — shows the deciding scoreline ── */
  if (c.sub.k === 'fulltime' && c.done) {
    const m = c.sub.m;
    const champ = c.done.champion;
    const top = topScorer(s.goals);
    const idx = s.gf * 13 + s.ga * 7 + c.stageIdx * 5;
    const shareTxt = mode === 'daily'
      ? t('card.shareTextDaily', { brand: BRAND })
      : t('card.shareText', { seed: seed.toString(36), brand: BRAND });
    const headline = champ ? flavor('champion', idx, locale) : flavor(OUT_CAT[c.done.stage], idx, locale);
    return (
      <motion.section className={`card ${champ ? 'card--perfect' : 'card--out'}`} variants={cardV} initial="hidden" animate="show">
        <ClubStripe colors={opp.colors} />
        <motion.p className="card-club" variants={riseIn}>{champ ? BRAND : stageLabel}</motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <CountScore n={m.gf} />
          <span className="score-sep">–</span>
          <CountScore n={m.ga} away />
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.leg === 2 && m.agg && (
          <motion.p className="perfect-tag" variants={riseIn}>{t('leg.agg', { gf: m.agg.gf, ga: m.agg.ga })}</motion.p>
        )}
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={`outcome ${champ ? 'outcome--win' : 'outcome--lose'}`} variants={riseIn}>{headline}</motion.p>
        <MatchTimeline m={m} />
        <motion.div className="scorers" variants={riseIn}>
          <h3 className="scorers-title">{t('card.campaign')}</h3>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-v">{s.pj}</span>
              <span className="stat-l">{t('stats.played')}</span>
              <span className="stat-s">{s.w}{t('rec.w')} {s.d}{t('rec.d')} {s.l}{t('rec.l')}</span>
            </div>
            <div className="stat">
              <span className="stat-v">{s.gf}:{s.ga}</span>
              <span className="stat-l">{t('stats.goalsShort')}</span>
              <span className="stat-s">{s.gf - s.ga >= 0 ? '+' : ''}{s.gf - s.ga}</span>
            </div>
            <div className="stat">
              <span className="stat-v">{s.cs}</span>
              <span className="stat-l">{t('stats.cs')}</span>
            </div>
            <div className="stat">
              <span className="stat-v">{top ? top.g : '—'}</span>
              <span className="stat-l">{t('stats.topScorer')}</span>
              <span className="stat-s">{top ? top.n : '—'}</span>
            </div>
          </div>
        </motion.div>
        {mode === 'daily' && champ && boardState !== 'done' && (
          <motion.div className="arcade" variants={riseIn}>
            <p className="arcade-title">{t('daily.enterName')}</p>
            <div className="seed-mini">
              <input
                className="seed-chip"
                value={arcadeName}
                maxLength={12}
                placeholder={t('daily.namePh')}
                onChange={(e) => setArcadeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') signBoard(); }}
                spellCheck={false}
                autoComplete="off"
              />
              <motion.button className="btn-mini" {...tap} disabled={boardState === 'sending'} onClick={signBoard}>
                {boardState === 'sending' ? '…' : t('daily.submit')}
              </motion.button>
            </div>
            {boardState === 'error' && <p className="board-note board-note--bad">{t('daily.error')}</p>}
          </motion.div>
        )}
        {mode === 'daily' && champ && boardState === 'done' && (
          <motion.p className="seed-hint" variants={riseIn}>{t('daily.submitted')}</motion.p>
        )}
        {mode === 'free' && (
          <>
            <motion.div className="seed-mini seed-mini--compact" variants={riseIn}>
              <code className="seed-chip">{seed.toString(36)}</code>
              <motion.button className={`btn-mini ${copied ? 'btn-mini--ok' : ''}`} {...tap} onClick={copySeed}>
                {copied ? t('home.copied') : t('home.copy')}
              </motion.button>
            </motion.div>
            <motion.p className="seed-hint" variants={riseIn}>{t('card.challenge')}</motion.p>
          </>
        )}
        {/* ── Compartir con jerarquía ── un primario (share nativo en mobile,
            WhatsApp como fallback de escritorio) y el resto en fila callada.
            Antes: dos share-rows apiladas + semilla = amontonamiento. */}
        <motion.div className="share-zone" variants={riseIn}>
          {typeof navigator !== 'undefined' && navigator.share ? (
            <button
              className="cta cta--share"
              onClick={() => { navigator.share({ text: shareTxt, url: SITE_URL }).catch(() => {}); }}
            ><IcoShare /><span>{t('card.share')}</span></button>
          ) : (
            <a
              className="cta cta--share"
              href={`https://wa.me/?text=${encodeURIComponent(`${shareTxt} ${SITE_URL}`)}`}
              target="_blank" rel="noopener noreferrer"
            ><IcoWa /><span>WhatsApp</span></a>
          )}
          <div className="share-quiet">
            <a
              className="share-chip share-chip--icon"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTxt)}&url=${encodeURIComponent(SITE_URL)}`}
              target="_blank" rel="noopener noreferrer" aria-label="X"
            ><IcoX /><span>X</span></a>
            {typeof navigator !== 'undefined' && !!navigator.share && (
              <a
                className="share-chip share-chip--icon"
                href={`https://wa.me/?text=${encodeURIComponent(`${shareTxt} ${SITE_URL}`)}`}
                target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              ><IcoWa /><span>WhatsApp</span></a>
            )}
            {shareCode && (
              <button
                className={`share-chip share-chip--icon ${codeCopied ? 'share-chip--ok' : ''}`}
                onClick={copyCode}
                aria-label={t('card.shareCode')}
              ><IcoShare /><span>{codeCopied ? t('card.shareCodeOk') : t('card.shareCode')}</span></button>
            )}
          </div>
        </motion.div>
        <motion.div className="card-ctas" variants={riseIn}>
          {mode === 'free' && (
            <motion.button className="cta cta--ghost" {...tap} onClick={onRetry}>{t('card.retry')}</motion.button>
          )}
          <motion.button className="cta" {...tap} onClick={onReset}>
            {mode === 'daily' ? t('daily.free') : t('card.again')}
          </motion.button>
        </motion.div>
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
    } else if (m.leg === 1) {
      /* La ida no elimina: el veredicto habla de la serie, no de avanzar. */
      const d = m.gf - m.ga;
      const legCat: Cat = d > 0 ? 'leg_win' : d < 0 ? 'leg_loss' : 'leg_draw';
      line = flavor(legCat, idx, locale);
    } else {
      const agg = m.agg ?? { gf: m.gf, ga: m.ga };
      const d = agg.gf - agg.ga;
      const koCat: Cat = m.pens ? 'pens_win' : d >= 4 ? 'ko_rout' : d >= 2 ? 'ko_clear' : 'ko_narrow';
      line = `${flavor(koCat, idx, locale)} ${t('advance.' + stage)}`.trim();
    }
    const lost = m.outcome === 'L';
    return (
      <motion.section className={`card ${lost ? 'card--out' : ''}`} variants={cardV} initial="hidden" animate="show">
        <ClubStripe colors={opp.colors} />
        <motion.p className="card-club" variants={riseIn}>
          {stageLabel}{m.leg ? ` · ${t(m.leg === 1 ? 'leg.first' : 'leg.second')}` : ''}
        </motion.p>
        <motion.div className="scoreline" variants={riseIn}>
          <CountScore n={m.gf} />
          <span className="score-sep">–</span>
          <CountScore n={m.ga} away />
        </motion.div>
        <motion.p className="vs" variants={riseIn}>{t('card.vs', { opp: `${m.oppName} · ${m.oppEdition}` })}</motion.p>
        {m.leg === 2 && m.agg && (
          <motion.p className="perfect-tag" variants={riseIn}>{t('leg.agg', { gf: m.agg.gf, ga: m.agg.ga })}</motion.p>
        )}
        {m.pens && <motion.p className="perfect-tag" variants={riseIn}>{t('card.pens', { a: m.pens.you, b: m.pens.opp })}</motion.p>}
        <motion.p className={`outcome ${lost ? 'outcome--lose' : 'outcome--win'}`} variants={riseIn}>{t(`result.${m.outcome}`)}</motion.p>
        {m.leg === 1 && <motion.p className="match-note" variants={riseIn}>{t('leg.return')}</motion.p>}
        <MatchTimeline m={m} />
        <motion.p className="flavor-line" variants={riseIn}>{line}</motion.p>
        <motion.button className="cta" variants={riseIn} {...tap} onClick={onNext}>
          {m.leg === 1 ? `${t('leg.playReturn')} →` : t('card.nextRound')}
        </motion.button>
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
    <section className="match match--wide">
      <p className="match-tag">{stageLabel}</p>
      <p className="tour-record">{record}</p>
      {isTwoLegged(stage) && (
        <p className="ticker-half pen-turn">
          {t(c.leg === 1 ? 'leg.first' : 'leg.second')}
          {c.leg === 2 && c.agg1 ? ` · ${t('leg.agg', { gf: c.agg1.gf, ga: c.agg1.ga })}` : ''}
        </p>
      )}
      {isTwoLegged(stage) && c.leg === 2 && <p className="match-note">{t('leg.rule')}</p>}

      <Bracket stageIdx={c.stageIdx} />

      <RivalReveal
        key={`${c.stageIdx}:${c.leg}:${c.oppId}`}
        rival={r}
        colors={opp.colors}
        inGroup={inGroup}
        groupPts={c.groupPts}
        xiAvg={xiAvg}
        you={xiProfile(c.xi)}
        tension={tension}
        onKickoff={onKickoff}
      />
    </section>
  );
}