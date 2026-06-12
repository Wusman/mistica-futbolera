import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { type Attitude, type PenAim, type Rival, type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker } from './MatchTicker';
import { GoalScene } from './GoalScene';

/* Pausa de la escena del penal en jugada antes de retomar el relato. */
const MPEN = { reveal: 1500 };

interface Pen1 { min: number; side: 'you' | 'opp'; res?: { aim: PenAim; dive: PenAim; scored: boolean } }

interface Props {
  rival: Rival;
  gf1: number;
  ga1: number;
  ev1: TickerEvent[];
  pen1?: Pen1;
  oppName: string;
  tickerSecs: number;
  onDecide: (a: Attitude) => void;
  onPen: (aim: PenAim) => void;
}

/* Primer tiempo. Sin penal: relato 0'→45' → decisión de entretiempo.
   Con penal en jugada: relato 0'→min → "¡PENAL!" (pateás o atajás según el
   lado) → escena del arco → relato min→45 con el marcador YA ajustado por
   el resultado (gf1/ga1/ev1 llegan ajustados desde el reducer). */
export function MatchStep({ rival, gf1, ga1, ev1, pen1, oppName, tickerSecs, onDecide, onPen }: Props) {
  const t = useT();
  const reduce = useReducedMotion();

  type Seg = 'l1' | 'pen' | 'l2' | 'ht';
  const [seg, setSeg] = useState<Seg>('l1');

  /* Resuelto el penal (llega res por props), dramatizar y retomar el relato. */
  const res = pen1?.res ?? null;
  useEffect(() => {
    if (seg !== 'pen' || !res) return;
    const id = window.setTimeout(() => setSeg('l2'), reduce ? 400 : MPEN.reveal);
    return () => window.clearTimeout(id);
  }, [seg, res, reduce]);

  if (seg === 'l1') {
    const cut = pen1 ? pen1.min : 46;
    return (
      <section className="match">
        <MatchTicker
          from={0}
          to={pen1 ? pen1.min : 45}
          events={ev1.filter((e) => e.min < cut)}
          oppName={rival.name}
          halfLabel={t('ticker.first')}
          endLabel={pen1 ? t('mpen.tag') : t('ticker.ht')}
          duration={tickerSecs * (pen1 ? pen1.min / 45 : 1)}
          onDone={() => setSeg(pen1 ? 'pen' : 'ht')}
        />
      </section>
    );
  }

  if (seg === 'pen' && pen1) {
    const mine = pen1.side === 'you';
    const resultText = res
      ? mine
        ? (res.scored ? (res.dive === res.aim ? t('pens.golazo') : t('pens.goal')) : res.dive === res.aim ? t('pens.saved') : t('pens.out'))
        : (res.scored ? (res.dive === res.aim ? t('pens.unstoppable') : t('pens.oppGoal', { opp: oppName })) : res.dive === res.aim ? t('pens.youSaved') : t('pens.oppOut'))
      : '';
    const resultGood = res ? (mine ? res.scored : !res.scored) : false;
    const aims: { key: PenAim; label: string }[] = [
      { key: 'L', label: t('pens.left') },
      { key: 'C', label: t('pens.center') },
      { key: 'R', label: t('pens.right') },
    ];
    return (
      <section className="match">
        <p className="match-tag">{pen1.min}&rsquo; · {t('mpen.tag')}</p>
        <p className="ticker-half pen-turn">{mine ? t('mpen.you') : t('mpen.opp')}</p>

        <GoalScene
          res={res}
          showAnim={!!res}
          keeperYou={!mine}
          resultText={resultText}
          resultGood={resultGood}
          animKey={`mpen:${pen1.min}`}
        />

        {!res && (
          <>
            <p className="match-note">{mine ? t('pens.aim') : t('pens.dive')}</p>
            <div className="pen-aims">
              {aims.map((a) => (
                <button key={a.key} className="att-btn pen-aim" onClick={() => onPen(a.key)}>
                  <b>{a.label}</b>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    );
  }

  if (seg === 'l2' && pen1) {
    return (
      <section className="match">
        <MatchTicker
          from={pen1.min}
          to={45}
          events={ev1.filter((e) => e.min >= pen1.min)}
          baseGf={ev1.filter((e) => e.min < pen1.min && e.side === 'you').length}
          baseGa={ev1.filter((e) => e.min < pen1.min && e.side === 'opp').length}
          oppName={rival.name}
          halfLabel={t('ticker.first')}
          endLabel={t('ticker.ht')}
          duration={tickerSecs * ((45 - pen1.min) / 45)}
          onDone={() => setSeg('ht')}
        />
      </section>
    );
  }

  const lead = gf1 - ga1;
  const note = lead > 0 ? t('match.lead.win') : lead < 0 ? t('match.lead.lose') : t('match.lead.draw');

  const options: { key: Attitude; label: string; note: string }[] = [
    { key: 'def', label: t('att.def.t'), note: t('att.def.d') },
    { key: 'eq', label: t('att.eq.t'), note: t('att.eq.d') },
    { key: 'off', label: t('att.off.t'), note: t('att.off.d') },
  ];

  return (
    <section className="match">
      <p className="match-tag">{t('match.halftime')}</p>

      <div className="scoreline">
        <span className="score">{gf1}</span>
        <span className="score-sep">–</span>
        <span className="score score--away">{ga1}</span>
      </div>

      <div className="scout">
        <span className="scout-name">{rival.name} · {rival.edition}</span>
        <div className="scout-bars">
          <span>{t('match.attackRival')} <b>{rival.atk}</b></span>
          <span>{t('match.defenseRival')} <b>{rival.def}</b></span>
        </div>
      </div>

      <p className="match-note">{note}</p>

      <div className="attitudes">
        {options.map((o) => (
          <button key={o.key} className="att-btn" onClick={() => onDecide(o.key)}>
            <b>{o.label}</b>
            <span>{o.note}</span>
          </button>
        ))}
      </div>
    </section>
  );
}