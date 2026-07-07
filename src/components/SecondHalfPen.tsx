import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { type PenAim, type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';
import { PenMoment } from './PenMoment';

const MPEN = { reveal: 1500 };

interface Props {
  stageLabel: string;
  oppName: string;
  ev1: TickerEvent[];          // 1er tiempo YA ajustado (para el marcador base)
  ev2: TickerEvent[];          // 2do tiempo (se ajusta al resolver el penal)
  end2: number;                // 90 + descuento
  pen: { min: number; side: 'you' | 'opp'; res?: { aim: PenAim; dive: PenAim; scored: boolean } };
  tickerSecs: number;
  onPen: (aim: PenAim) => void;
  onSettle: () => void;
}

/* Penal en jugada del 2do tiempo: relato 45'→min → ¡PENALTI! → escena →
   se liquida el partido (H2_DONE) y el resto del relato (min→90+X) lo juega
   el flujo normal de fulltime/tanda con `resume`. */
export function SecondHalfPen({ stageLabel, oppName, ev1, ev2, end2, pen, tickerSecs, onPen, onSettle }: Props) {
  const t = useT();
  const reduce = useReducedMotion();
  const [seg, setSeg] = useState<'live' | 'pen'>('live');

  const res = pen.res ?? null;
  useEffect(() => {
    if (seg !== 'pen' || !res) return;
    const id = window.setTimeout(onSettle, reduce ? 400 : MPEN.reveal);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg, res, reduce]);

  if (seg === 'live') {
    return (
      <section className="match">
        <p className="match-tag">{stageLabel}</p>
        <MatchTicker
          from={45}
          to={pen.min}
          events={ev2.filter((e) => e.min < pen.min)}
          priorEvents={ev1}
          baseGf={ev1.filter((e) => e.side === 'you').length}
          baseGa={ev1.filter((e) => e.side === 'opp').length}
          oppName={oppName}
          halfLabel={t('ticker.second')}
          endLabel={t('mpen.tag')}
          duration={tickerSecs * ((pen.min - 45) / (end2 - 45))}
          onDone={() => setSeg('pen')}
        />
      </section>
    );
  }

  return (
    <section className="match">
      <PenMoment min={pen.min} mine={pen.side === 'you'} res={res} oppName={oppName} onPen={onPen} />
    </section>
  );
}