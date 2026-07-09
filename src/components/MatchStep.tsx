import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { type Attitude, type PenAim, type Rival, type TickerEvent } from '../lib/engine';
import { useT } from '../i18n';
import { MatchTicker, type Crest } from './MatchTicker';
import { PenMoment } from './PenMoment';

/* Pausa de la escena del penal en jugada antes de retomar el relato. */
const MPEN = { reveal: 1500 };

/* Entrada del entretiempo: chyron → marcador (slam) → dossier → botones.
   Presentación pura; MotionConfig frena todo con movimiento reducido. */
const htC = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const htRise = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } } };
const htSlam = { hidden: { opacity: 0, scale: 1.5 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 18 } } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

interface Pen1 { min: number; side: 'you' | 'opp'; res?: { aim: PenAim; dive: PenAim; scored: boolean } }

interface Props {
  youCrest: Crest;   // escudo del jugador
  rivalCrest: Crest; // escudo del rival (los stats de combate van en `rival`)
  rival: Rival;
  gf1: number;
  ga1: number;
  ev1: TickerEvent[];
  end1: number; // 45 + descuento
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
export function MatchStep({ youCrest, rivalCrest, rival, gf1, ga1, ev1, end1, pen1, oppName, tickerSecs, onDecide, onPen }: Props) {
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
    const cut = pen1 ? pen1.min : end1 + 1;
    return (
      <section className="match">
        <MatchTicker
          you={youCrest}
          rival={rivalCrest}
          from={0}
          to={pen1 ? pen1.min : end1}
          events={ev1.filter((e) => e.min < cut)}
          oppName={rival.name}
          halfLabel={t('ticker.first')}
          endLabel={pen1 ? t('mpen.tag') : t('ticker.ht')}
          duration={tickerSecs * (pen1 ? pen1.min / end1 : 1)}
          onDone={() => setSeg(pen1 ? 'pen' : 'ht')}
        />
      </section>
    );
  }

  if (seg === 'pen' && pen1) {
    return (
      <section className="match">
        <PenMoment min={pen1.min} mine={pen1.side === 'you'} res={res} oppName={oppName} onPen={onPen} />
      </section>
    );
  }

  if (seg === 'l2' && pen1) {
    return (
      <section className="match">
        <MatchTicker
          you={youCrest}
          rival={rivalCrest}
          from={pen1.min}
          to={end1}
          events={ev1.filter((e) => e.min >= pen1.min)}
          priorEvents={ev1.filter((e) => e.min < pen1.min)}
          baseGf={ev1.filter((e) => e.min < pen1.min && e.side === 'you').length}
          baseGa={ev1.filter((e) => e.min < pen1.min && e.side === 'opp').length}
          oppName={rival.name}
          halfLabel={t('ticker.first')}
          endLabel={t('ticker.ht')}
          duration={tickerSecs * ((end1 - pen1.min) / end1)}
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
    <motion.section className="match" variants={htC} initial="hidden" animate="show">
      <motion.p className="match-tag" variants={htRise}>{t('match.halftime')}</motion.p>

      <motion.div className="scoreline" variants={htSlam}>
        <span className="score">{gf1}</span>
        <span className="score-sep">–</span>
        <span className="score score--away">{ga1}</span>
      </motion.div>

      <motion.div className="scout" variants={htRise}>
        <span className="scout-name">{rival.name} · {rival.edition}</span>
        <div className="scout-bars">
          <span>{t('match.attackRival')} <b>{rival.atk}</b></span>
          <span>{t('match.defenseRival')} <b>{rival.def}</b></span>
        </div>
      </motion.div>

      <motion.p className="match-note" variants={htRise}>{note}</motion.p>

      <div className="attitudes">
        {options.map((o) => (
          <motion.button key={o.key} className="att-btn" variants={htRise} {...tap} onClick={() => onDecide(o.key)}>
            <b>{o.label}</b>
            <span>{o.note}</span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}