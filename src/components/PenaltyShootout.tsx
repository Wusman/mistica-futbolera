import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type PenAim, type PenKickResult, type OppPenResult, type TickerEvent, pensTurn } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';

/* ── Tunables de la tanda ──
   reveal: ms que dura la animación de cada penal (pelota + arquero + cartel).
   toss: ms del splash del sorteo antes de habilitar el primer turno. */
const PEN = { reveal: 1250, toss: 1700 };

/* Coordenadas en el viewBox 100×62 del arco. */
const ZONE: Record<PenAim, { x: number; y: number }> = {
  L: { x: 24, y: 27 }, C: { x: 50, y: 24 }, R: { x: 76, y: 27 },
};
const OUT: Record<PenAim, { x: number; y: number }> = {
  L: { x: 3, y: 10 }, C: { x: 50, y: -4 }, R: { x: 97, y: 10 },
};
/* Gol con el palo ADIVINADO: la pelota lo pasa por arriba, al rincón. Si
   aterrizara en el mismo punto que el arquero, parecería un robo. */
const PAST: Record<PenAim, { x: number; y: number }> = {
  L: { x: 16, y: 15 }, C: { x: 50, y: 13 }, R: { x: 84, y: 15 },
};
const KEEPER_Y = 38;
const BALL_START = { x: 50, y: 57 };

interface Props {
  stageLabel: string;
  oppName: string;
  gf: number;
  ga: number;
  ev: TickerEvent[];
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
  stageLabel, oppName, gf, ga, ev, first, you, opp, winner, tickerSecs, onKick, onDive, onDone,
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
          from={45}
          to={90}
          events={ev.filter((e) => e.min > 45)}
          baseGf={ev.filter((e) => e.min <= 45 && e.side === 'you').length}
          baseGa={ev.filter((e) => e.min <= 45 && e.side === 'opp').length}
          oppName={oppName}
          halfLabel={t('ticker.second')}
          endLabel={t('pens.title')}
          duration={tickerSecs}
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

  /* Destino de la pelota: misma geometría para ambos lados (es "el arco"). */
  const ballTo = last
    ? last.scored
      ? (last.dive === last.aim ? PAST[last.aim] : ZONE[last.aim])  // adivinado pero gol: al rincón
      : last.dive === last.aim
        ? { x: ZONE[last.dive].x, y: KEEPER_Y - 4 }   // atajada: muere en el arquero
        : OUT[last.aim]                                // errado: se va afuera
    : BALL_START;

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

      <div className="goalbox">
        <svg className="goal" viewBox="0 0 100 62" aria-hidden="true">
          <defs>
            <pattern id="net" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
              <path d="M0 0H3.4M0 0V3.4" className="net-line" />
            </pattern>
          </defs>
          <rect x="9" y="9" width="82" height="44" fill="url(#net)" />
          <path d="M9 53 V9 H91 V53" className="goal-frame" />
          <line x1="0" y1="53" x2="100" y2="53" className="goal-ground" />

          {/* Arquero: rival (tinte de semilla) cuando pateás vos; el TUYO
              (dorado) cuando atajás. Se tira al palo que corresponda. */}
          <motion.g
            className={`keeper ${showAnim && lastSide === 'opp' ? 'keeper--you' : ''}`}
            initial={false}
            animate={
              showAnim && last
                ? { x: ZONE[last.dive].x - 50, y: -5, rotate: reduce ? 0 : last.dive === 'L' ? -18 : last.dive === 'R' ? 18 : 0 }
                : { x: 0, y: 0, rotate: 0 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 17 }}
          >
            <circle cx="50" cy={KEEPER_Y - 6.5} r="3" />
            <rect x="46.4" y={KEEPER_Y - 3.5} width="7.2" height="12" rx="3" />
          </motion.g>

          {showAnim && (
            <motion.circle
              key={total}
              className="pen-ball"
              r="2.6"
              initial={{ cx: BALL_START.x, cy: BALL_START.y, scale: 1 }}
              animate={{ cx: ballTo.x, cy: ballTo.y, scale: 0.82 }}
              transition={reduce ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
            />
          )}
        </svg>

        {showAnim && resultText && (
          <motion.p
            key={`r${total}`}
            className={`pen-result ${resultGood ? 'pen-result--goal' : 'pen-result--miss'}`}
            initial={reduce ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.5, type: 'spring', stiffness: 300, damping: 18 }}
          >
            {resultText}
          </motion.p>
        )}
      </div>

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