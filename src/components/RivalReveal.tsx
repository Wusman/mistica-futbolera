import { type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { type Rival } from '../lib/engine';
import { useT } from '../i18n';

const REVEAL = { blur: 14, focus: 0.7, stagger: 0.08 };

interface Props {
  rival: Rival;
  colors: string[];
  inGroup: boolean;
  groupPts: number;
  xiAvg: number;
  tension: string;
  onKickoff: () => void;
}

const container = { hidden: {}, show: { transition: { staggerChildren: REVEAL.stagger, delayChildren: 0.05 } } };
const focusIn = {
  hidden: { opacity: 0, y: 8, filter: `blur(${REVEAL.blur}px)` },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: REVEAL.focus, ease: 'easeOut' as const } },
};
const riseIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};
const barsContainer = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export function RivalReveal({ rival, colors, inGroup, groupPts, xiAvg, tension, onKickoff }: Props) {
  const t = useT();
  const bars = { '--club': colors[0] } as CSSProperties;

  return (
    <motion.div className="reveal" variants={container} initial="hidden" animate="show">
      <motion.p className="reveal-tag" variants={riseIn}>{t('match.next')}</motion.p>

      <motion.div className="scout" style={bars} variants={focusIn}>
        <div className="club-colors">
          {colors.map((col, k) => <span key={k} style={{ background: col }} />)}
        </div>
        <span className="scout-name">{rival.name} · {rival.edition}</span>
        <motion.div className="scout-bars" variants={barsContainer}>
          <motion.span variants={riseIn}>{t('common.attack')} <b>{rival.atk}</b></motion.span>
          <motion.span variants={riseIn}>{t('common.defense')} <b>{rival.def}</b></motion.span>
          <motion.span variants={riseIn}>{t('common.avg')} <b>{rival.overall}</b></motion.span>
        </motion.div>
      </motion.div>

      <motion.p className="tension" variants={riseIn}>{tension}</motion.p>

      <motion.p className="match-note" variants={riseIn}>
        {t('match.yourAvg')}: <b>{xiAvg}</b>
        {inGroup ? ` ${t('match.groupPts', { p: groupPts })}` : ''}
      </motion.p>

      <motion.button className="cta" variants={riseIn} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onKickoff}>
        {t('match.play')}
      </motion.button>
    </motion.div>
  );
}