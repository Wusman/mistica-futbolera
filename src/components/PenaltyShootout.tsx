import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type PenAim, type PenKickResult, type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';

/* ── Tunables de la tanda ──
   reveal: ms que dura la animación de tu tiro (pelota + arquero + cartel).
   oppBeat: ms extra para mostrar el penal rival antes de habilitar el próximo. */
const PEN = { reveal: 1100, oppBeat: 900 };

/* Coordenadas en el viewBox 100×62 del arco. */
const ZONE: Record<PenAim, { x: number; y: number }> = {
  L: { x: 24, y: 27 }, C: { x: 50, y: 24 }, R: { x: 76, y: 27 },
};
const OUT: Record<PenAim, { x: number; y: number }> = {
  L: { x: 3, y: 10 }, C: { x: 50, y: -4 }, R: { x: 97, y: 10 },
};
const KEEPER_Y = 38;
const BALL_START = { x: 50, y: 57 };

interface Props {
  stageLabel: string;
  oppName: string;
  gf: number;
  ga: number;
  ev: TickerEvent[];
  you: PenKickResult[];
  opp: boolean[];
  winner?: 'you' | 'opp';
  tickerSecs: number;
  onKick: (aim: PenAim) => void;
  onDone: () => void;
}

/* Presentación pura sobre decisiones + engine: cada tiro tuyo es un dispatch
   (KICK) que el reducer resuelve con penKick/oppPenKick; acá solo se anima
   el último resultado. Nada de azar en el componente. */
export function PenaltyShootout({ stageLabel, oppName, gf, ga, ev, you, opp, winner, tickerSecs, onKick, onDone }: Props) {
  const t = useT();
  const reduce = useReducedMotion();

  /* Relato del 2do tiempo primero (45'→90'), después la tanda. */
  const [live, setLive] = useState(true);

  /* 'aim' espera tu elección; 'reveal' anima el último tiro (y el rival). */
  const [step, setStep] = useState<'aim' | 'reveal' | 'done'>('aim');
  const timer = useRef<number | null>(null);

  const last = you.length > 0 ? you[you.length - 1] : null;
  const oppKickedThisRound = opp.length === you.length && opp.length > 0;

  useEffect(() => {
    if (step !== 'reveal') return;
    const wait = reduce ? 200 : PEN.reveal + (oppKickedThisRound ? PEN.oppBeat : 0);
    timer.current = window.setTimeout(() => setStep(winner ? 'done' : 'aim'), wait);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, you.length]);

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

  const kick = (aim: PenAim) => {
    if (step !== 'aim' || winner) return;
    onKick(aim);
    setStep('reveal');
  };

  /* Destino de la pelota según el resultado del último tiro. */
  const ballTo = last
    ? last.scored
      ? ZONE[last.aim]
      : last.dive === last.aim
        ? { x: ZONE[last.dive].x, y: KEEPER_Y - 4 }   // atajada: muere en el arquero
        : OUT[last.aim]                                // errado: se va afuera
    : BALL_START;

  const showAnim = step !== 'aim' && last !== null;
  const resultKey: 'pens.goal' | 'pens.saved' | 'pens.out' | null = last
    ? last.scored ? 'pens.goal' : last.dive === last.aim ? 'pens.saved' : 'pens.out'
    : null;
  const lastOpp = oppKickedThisRound ? opp[opp.length - 1] : null;

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

      <div className="goalbox">
        <svg className="goal" viewBox="0 0 100 62" aria-hidden="true">
          <defs>
            <pattern id="net" width="3.4" height="3.4" patternUnits="userSpaceOnUse">
              <path d="M0 0H3.4M0 0V3.4" className="net-line" />
            </pattern>
          </defs>
          {/* red + marco propio (cualquier arco del mundo se ve así) */}
          <rect x="9" y="9" width="82" height="44" fill="url(#net)" />
          <path d="M9 53 V9 H91 V53" className="goal-frame" />
          <line x1="0" y1="53" x2="100" y2="53" className="goal-ground" />

          {/* arquero abstracto: se tira al palo sorteado */}
          <motion.g
            className="keeper"
            initial={false}
            animate={
              showAnim && last && !reduce
                ? { x: ZONE[last.dive].x - 50, y: -5, rotate: last.dive === 'L' ? -18 : last.dive === 'R' ? 18 : 0 }
                : showAnim && last
                  ? { x: ZONE[last.dive].x - 50, y: -5, rotate: 0 }
                  : { x: 0, y: 0, rotate: 0 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 17 }}
          >
            <circle cx="50" cy={KEEPER_Y - 6.5} r="3" />
            <rect x="46.4" y={KEEPER_Y - 3.5} width="7.2" height="12" rx="3" />
          </motion.g>

          {/* pelota: del punto penal al destino del último tiro */}
          {showAnim && (
            <motion.circle
              key={you.length}
              className="pen-ball"
              r="2.6"
              initial={{ cx: BALL_START.x, cy: BALL_START.y, scale: 1 }}
              animate={{ cx: ballTo.x, cy: ballTo.y, scale: 0.82 }}
              transition={reduce ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
            />
          )}
        </svg>

        {/* cartel del resultado + penal rival */}
        {showAnim && resultKey && (
          <motion.p
            key={`r${you.length}`}
            className={`pen-result ${last!.scored ? 'pen-result--goal' : 'pen-result--miss'}`}
            initial={reduce ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.5, type: 'spring', stiffness: 300, damping: 18 }}
          >
            {t(resultKey)}
          </motion.p>
        )}
        {showAnim && lastOpp !== null && (
          <motion.p
            key={`o${opp.length}`}
            className="pen-opp"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 1.0, duration: 0.3 }}
          >
            {lastOpp ? t('pens.oppGoal', { opp: oppName }) : t('pens.oppMiss', { opp: oppName })}
          </motion.p>
        )}
      </div>

      {/* tablero de la tanda */}
      <div className="pen-board">
        <div className="pen-row">
          <span className="pen-side">{t('pens.you')}</span>
          <span className="pen-dots pen-dots--you">{dots(you.map((k) => k.scored), you.length).join(' ')}</span>
        </div>
        <div className="pen-row">
          <span className="pen-side">{t('pens.opp')}</span>
          <span className="pen-dots">{dots(opp, opp.length).join(' ')}</span>
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
          <p className="match-note">{t('pens.aim')}</p>
          <div className="pen-aims">
            {aims.map((a) => (
              <motion.button
                key={a.key}
                className="att-btn pen-aim"
                disabled={step !== 'aim'}
                whileHover={step === 'aim' ? { scale: 1.03 } : undefined}
                whileTap={step === 'aim' ? { scale: 0.96 } : undefined}
                onClick={() => kick(a.key)}
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