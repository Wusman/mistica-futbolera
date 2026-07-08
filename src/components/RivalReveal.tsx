import { motion } from 'framer-motion';
import { type Rival } from '../lib/engine';
import { useT } from '../i18n';
import { Emblem } from './Emblem';
import { loadEscudo, loadTeamName } from '../lib/escudo';
import { YOU_EMBLEM } from '../config';

interface Props {
  rival: Rival;
  colors: string[];
  inGroup: boolean;
  groupPts: number;
  xiAvg: number;
  you: { atk: number; def: number };
  tension: string;
  onKickoff: () => void;
}

const slideL = { hidden: { opacity: 0, x: -48 }, show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 220, damping: 24 } } };
const slideR = { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 220, damping: 24 } } };
const slam = { hidden: { opacity: 0, scale: 2.2, rotate: -10 }, show: { opacity: 1, scale: 1, rotate: -8, transition: { type: 'spring' as const, stiffness: 260, damping: 14, delay: 0.18 } } };
const rise = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const, delay: 0.32 } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* Pantalla de enfrentamiento estilo cartelera de pelea: tu once a la izquierda,
   el rival entra desde la derecha con sus colores, y el VS se estampa en el
   medio. Presentación pura sobre datos ya escalados por etapa (scaledRivalOf). */
export function RivalReveal({ rival, colors, inGroup, groupPts, xiAvg, you, tension, onKickoff }: Props) {
  const t = useT();

  return (
    <motion.div className="reveal" variants={container} initial="hidden" animate="show">
      <div className="versus">
        <motion.div className="vs-side vs-side--you" variants={slideL}>
          <Emblem colors={loadEscudo() ?? YOU_EMBLEM} size={44} className="vs-crest" />
          <p className="vs-tag">{loadTeamName() || t('vs.you')}</p>
          <p className="vs-num vs-num--gold">{xiAvg}</p>
          <p className="vs-sub">{t('common.avg')}</p>
          <div className="vs-bars">
            <span>{t('common.attack')} <b>{you.atk}</b></span>
            <span>{t('common.defense')} <b>{you.def}</b></span>
          </div>
        </motion.div>

        <motion.p className="vs-mid" variants={slam} aria-hidden="true">VS</motion.p>

        <motion.div className="vs-side vs-side--opp" variants={slideR}>
          <Emblem colors={colors} size={44} className="vs-crest" />
          <p className="vs-tag">{rival.name}</p>
          <p className="vs-num">{rival.overall}</p>
          <p className="vs-sub">{rival.edition}</p>
          <div className="vs-bars">
            <span>{t('common.attack')} <b>{rival.atk}</b></span>
            <span>{t('common.defense')} <b>{rival.def}</b></span>
          </div>
        </motion.div>
      </div>

      <motion.p className="tension" variants={rise}>{tension}</motion.p>
      {inGroup && (
        <motion.p className="tour-record" variants={rise}>
          {t('match.groupPts', { p: groupPts }).replace(/^·\s*/, '')}
        </motion.p>
      )}

      <motion.button className="cta cta--xl cta--kickoff" variants={rise} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onKickoff}>
        {t('match.play')} →
      </motion.button>
    </motion.div>
  );
}