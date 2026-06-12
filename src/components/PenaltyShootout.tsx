import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type PenAim, type PenKickResult, type OppPenResult, type TickerEvent, pensTurn, evHalf } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';
import { GoalScene } from './GoalScene';

/* ── Tunables de la tanda ──
   reveal: ms que dura la animación de cada penal (pelota + arquero + cartel).
   toss: ms del splash del sorteo antes de habilitar el primer turno. */
const PEN = { reveal: 1250, toss: 1700 };

interface Props {
  stageLabel: string;
  oppName: string;
  gf: number;
  ga: number;
  ev: TickerEvent[];
  end2: number;            // 90 + descuento
  resume?: number;         // si hubo penal en jugada en el 2T, retoma desde ahí
  first: 'you' | 'opp';
  you: PenKickResult[];
  opp: OppPenResult[];
  winner?: 'you' | 'opp';
  tickerSecs: number;
  onKick: (aim: PenAim) => void;
  onDive: (aim: PenAim) => void;
  onDone: () => void;
}

/* Tanda v2 — un penal por turno, alternancia estricta desde el sorteo:
   · Tu turno: elegís palo (KICK); el arquero rival se sortea de la semilla.
   · Turno rival: SU palo se sortea de la semilla; vos elegís dónde se tira
     TU arquero (DIVE). Cada dispatch resuelve UN penal; acá solo se anima
     el último. Nada de azar en el componente. */
export function PenaltyShootout({
  stageLabel, oppName, gf, ga, ev, end2, resume, first, you, opp, winner, tickerSecs, onKick, onDive, onDone,
}: Props) {
  const t = useT();
  const reduce = useReducedMotion();

  /* Relato del 2do tiempo primero (45'→90'), después sorteo, después la tanda. */
  const [live, setLive] = useState(true);
  const [tossSeen, setTossSeen] = useState(false);

  /* 'idle' espera la decisión del turno; 'reveal' anima el último penal. */
  const [step, setStep] = useState<'idle' | 'reveal' | 'done'>('idle');
  const timer = useRef<number | null>(null);

  const total = you.length + opp.length;
  const turn = pensTurn(first, you.length, opp.length);
  const other: 'you' | 'opp' = first === 'you' ? 'opp' : 'you';
  const lastSide: 'you' | 'opp' | null = total === 0 ? null : (total - 1) % 2 === 0 ? first : other;
  const last = lastSide === 'you' ? you[you.length - 1] : lastSide === 'opp' ? opp[opp.length - 1] : null;

  useEffect(() => {
    if (step !== 'reveal') return;
    const wait = reduce ? 250 : PEN.reveal;
    timer.current = window.setTimeout(() => setStep(winner ? 'done' : 'idle'), wait);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, total]);

  /* El sorteo se muestra una vez y avanza solo (o con un tap). */
  useEffect(() => {
    if (live || tossSeen) return;
    const id = window.setTimeout(() => setTossSeen(true), reduce ? 400 : PEN.toss);
    return () => window.clearTimeout(id);
  }, [live, tossSeen, reduce]);

  if (live) {
    return (
      <section className="match">
        <p className="match-tag">{stageLabel}</p>
        <MatchTicker
          from={resume ?? 45}
          to={end2}
          events={ev.filter((e) => evHalf(e) === 2 && e.min >= (resume ?? 46))}
          baseGf={ev.filter((e) => e.side === 'you' && (evHalf(e) === 1 || e.min < (resume ?? 46))).length}
          baseGa={ev.filter((e) => e.side === 'opp' && (evHalf(e) === 1 || e.min < (resume ?? 46))).length}
          oppName={oppName}
          halfLabel={t('ticker.second')}
          endLabel={t('pens.title')}
          duration={tickerSecs * ((end2 - (resume ?? 45)) / (end2 - 45))}
          onDone={() => setLive(false)}
        />
      </section>
    );
  }

  if (!tossSeen) {
    return (
      <section className="match" onClick={() => setTossSeen(true)} role="button" tabIndex={0}>
        <p className="match-tag">{t('pens.toss')}</p>
        <motion.p
          className="toss-line"
          initial={reduce ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          {first === 'you' ? t('pens.first.you') : t('pens.first.opp')}
        </motion.p>
        <p className="reel-hint">{t('ticker.skip')}</p>
      </section>
    );
  }

  const decide = (aim: PenAim) => {
    if (step !== 'idle' || winner) return;
    if (turn === 'you') onKick(aim);
    else onDive(aim);
    setStep('reveal');
  };

  const showAnim = step !== 'idle' && last !== null;
  const resultText = last
    ? lastSide === 'you'
      ? (last.scored
          ? (last.dive === last.aim ? t('pens.golazo') : t('pens.goal'))
          : last.dive === last.aim ? t('pens.saved') : t('pens.out'))
      : (last.scored
          ? (last.dive === last.aim ? t('pens.unstoppable') : t('pens.oppGoal', { opp: oppName }))
          : last.dive === last.aim ? t('pens.youSaved') : t('pens.oppOut'))
    : '';
  const resultGood = last ? (lastSide === 'you' ? last.scored : !last.scored) : false;

  const dots = (arr: boolean[], n: number) =>
    Array.from({ length: Math.max(5, n) }, (_, i) =>
      i < arr.length ? (arr[i] ? '●' : '✕') : '·',
    );

  const aims: { key: PenAim; label: string }[] = [
    { key: 'L', label: t('pens.left') },
    { key: 'C', label: t('pens.center') },
    { key: 'R', label: t('pens.right') },
  ];

  return (
    <section className="match">
      <p className="match-tag">{stageLabel}</p>
      <p className="tour-record">{gf}–{ga} · {t('pens.title')} · {oppName}</p>

      {/* De quién es el penal que se juega / se va a jugar. */}
      <p className="ticker-half pen-turn">
        {showAnim
          ? (lastSide === 'you' ? t('pens.turn.you') : t('pens.turn.opp'))
          : (turn === 'you' ? t('pens.turn.you') : t('pens.turn.opp'))}
      </p>

      <GoalScene
        res={last}
        showAnim={showAnim}
        keeperYou={showAnim && lastSide === 'opp'}
        resultText={resultText}
        resultGood={resultGood}
        animKey={total}
      />

      {/* Tablero de la tanda (1º = quién arrancó pateando). */}
      <div className="pen-board">
        <div className="pen-row">
          <span className="pen-side">{t('pens.you')}{first === 'you' ? ' · 1º' : ''}</span>
          <span className="pen-dots pen-dots--you">{dots(you.map((k) => k.scored), you.length).join(' ')}</span>
        </div>
        <div className="pen-row">
          <span className="pen-side">{t('pens.opp')}{first === 'opp' ? ' · 1º' : ''}</span>
          <span className="pen-dots">{dots(opp.map((k) => k.scored), opp.length).join(' ')}</span>
        </div>
      </div>

      {step === 'done' && winner ? (
        <>
          <p className={`tension ${winner === 'opp' ? 'tension--bad' : ''}`}>
            {winner === 'you' ? t('pens.win') : t('pens.lose')}
          </p>
          <motion.button className="cta" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onDone}>
            {t('pens.see')}
          </motion.button>
        </>
      ) : (
        <>
          <p className="match-note">{turn === 'you' ? t('pens.aim') : t('pens.dive')}</p>
          <div className="pen-aims">
            {aims.map((a) => (
              <motion.button
                key={a.key}
                className="att-btn pen-aim"
                disabled={step !== 'idle'}
                whileHover={step === 'idle' ? { scale: 1.03 } : undefined}
                whileTap={step === 'idle' ? { scale: 0.96 } : undefined}
                onClick={() => decide(a.key)}
              >
                <b>{a.label}</b>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}