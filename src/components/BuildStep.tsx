import { type CSSProperties, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FORMATIONS,
  TEAMS,
  type FormationName,
  type Player,
  type Pos,
} from '../data/players';
import { posLabel } from '../labels';
import { useT, useLocale } from '../i18n';
import {
  type Lineup,
  draftTeamAt,
  openSlotsFor,
  lineupFilled,
  shortName,
} from '../lib/engine';
import { TeamReel } from './TeamReel';
import { PitchMarkings } from './PitchMarkings';

interface Props {
  seed: number;
  step: number;
  lineup: Lineup;
  passes: number;
  formation: FormationName;
  onPick: (p: Player, slot: number) => void;
  onSkip: () => void;
  onPass: () => void;
  onSimulate: () => void;
}

const listV = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemV = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };
const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

export function BuildStep({
  seed,
  step,
  lineup,
  passes,
  formation,
  onPick,
  onSkip,
  onPass,
  onSimulate,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const slots = FORMATIONS[formation].slots;
  const team = draftTeamAt(seed, step);
  const [pending, setPending] = useState<Player | null>(null);
  const [spinning, setSpinning] = useState(true);

  // Reset reel + pending when a new champion is drawn (prop-change-in-render).
  const [prevStep, setPrevStep] = useState(step);
  if (prevStep !== step) {
    setPrevStep(step);
    setSpinning(true);
    setPending(null);
  }

  const taken = new Set(lineup.filter((c): c is Player => c !== null).map((p) => p.i));
  const eligible = team.players.filter(
    (p) => !taken.has(p.i) && openSlotsFor(p, lineup, formation).length > 0,
  );

  const placed = lineup.filter((c): c is Player => c !== null);
  const overall = placed.length
    ? Math.round(placed.reduce((s, p) => s + p.r, 0) / placed.length)
    : 0;
  const ready = lineupFilled(lineup);

  const lineAvg = (set: Set<Pos>) => {
    const rs = slots
      .map((s, i) => (set.has(s.pos) && lineup[i] ? lineup[i]!.r : null))
      .filter((x): x is number => x !== null);
    return rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
  };
  const attack = lineAvg(new Set<Pos>(['RW', 'LW', 'ST']));
  const defense = lineAvg(new Set<Pos>(['GK', 'RB', 'CB', 'LB']));

  const choosable = pending ? openSlotsFor(pending, lineup, formation) : [];

  const handlePick = (p: Player) => {
    const opts = openSlotsFor(p, lineup, formation);
    if (opts.length === 1) onPick(p, opts[0]);
    else setPending(p);
  };

  const placeAt = (slot: number) => {
    if (!pending) return;
    onPick(pending, slot);
    setPending(null);
  };

  /* Sin spoiler: el color del club recién aparece cuando el tambor clava. */
  const bannerStyle = (spinning ? {} : { '--club': team.colors[0] }) as CSSProperties;

  return (
    <section className="board3">
      {/* ── Left: champion on offer + picks ── */}
      <div className="b3-pick">
        <header className="draft-head">
          <span className="draft-step">{placed.length} {t('draft.of')}</span>
          <span className="overall-inline">{t('common.avg')} {overall}</span>
        </header>

        {!ready ? (
          <div className="draft-pick" style={bannerStyle}>
            {spinning ? (
              <TeamReel
                teams={TEAMS}
                target={team}
                spinKey={`${seed}:${step}`}
                label={t('draft.spinning')}
                onDone={() => setSpinning(false)}
              />
            ) : pending ? (
              <div className="draft-none">
                <p className="choose-hint">{t('draft.choose', { n: pending.n })}</p>
                <motion.button className="cta cta--ghost" {...tap} onClick={() => setPending(null)}>
                  {t('common.cancel')}
                </motion.button>
              </div>
            ) : (
              <>
                <header className="draft-champ" key={team.id}>
                  <div className="club-colors">
                    {team.colors.map((c, k) => (
                      <span key={k} style={{ background: c }} />
                    ))}
                  </div>
                  <h2 className="club-name">{team.name}</h2>
                  <p className="club-edition">{team.edition}</p>
                </header>

                {eligible.length > 0 ? (
                  <>
                    <motion.ul className="players" key={team.id} variants={listV} initial="hidden" animate="show">
                      {eligible.map((p) => (
                        <motion.li key={p.i} variants={itemV}>
                          <motion.button className={`player ${p.r >= 88 ? 'player--crack' : ''}`} {...tap} onClick={() => handlePick(p)}>
                            <span className="player-name">
                              {p.r >= 88 ? '★ ' : ''}
                              {p.n}
                            </span>
                            <span className="player-pos">{p.pos.map((x) => posLabel(x, locale)).join('/')}</span>
                            <span className="player-rating">{p.r}</span>
                          </motion.button>
                        </motion.li>
                      ))}
                    </motion.ul>
                    <div className="passes">
                      <span className="passes-count">{t('draft.passes')}: {passes}</span>
                      <motion.button className="cta cta--ghost" {...tap} disabled={passes <= 0} onClick={onPass}>
                        {t('draft.pass')}
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="draft-none">
                    <p>{t('draft.none')}</p>
                    <motion.button className="cta cta--ghost" {...tap} onClick={onSkip}>
                      {t('draft.reroll')}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <motion.button className="cta" {...tap} onClick={onSimulate}>
            {t('draft.simulate')}
          </motion.button>
        )}
      </div>

      {/* ── Center: the board (slots pop in with a spring when filled) ── */}
      <div className="b3-board">
        <div className="pitch">
          <PitchMarkings />
          {slots.map((slot, i) => {
            const player = lineup[i];
            const isChoosable = choosable.includes(i);
            return (
              <motion.div
                key={`${i}-${player ? player.i : 'empty'}`}
                className={`pslot ${player ? 'pslot--filled' : 'pslot--empty'} ${isChoosable ? 'pslot--choose' : ''}`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%`, x: '-50%', y: '-50%' }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                onClick={isChoosable ? () => placeAt(i) : undefined}
                {...(isChoosable ? { whileHover: { scale: 1.08 }, whileTap: { scale: 0.95 } } : {})}
              >
                {player ? (
                  <>
                    <span className="pslot-name">{shortName(player.n)}</span>
                    <span className="pslot-rating">{player.r}</span>
                  </>
                ) : (
                  <span className="pslot-pos">{posLabel(slot.pos, locale)}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Right: box score ── */}
      <div className="b3-list">
        <div className="bs-summary">
          <span>{t('common.attack')} <b>{attack || '—'}</b></span>
          <span>{t('common.defense')} <b>{defense || '—'}</b></span>
        </div>
        <ul className="boxscore">
          {slots.map((slot, i) => {
            const pl = lineup[i];
            return (
              <li key={i} className="bs-row">
                <span className="bs-pos">{posLabel(slot.pos, locale)}</span>
                <span className="bs-name">{pl ? shortName(pl.n) : '—'}</span>
                <span className="bs-rat">{pl ? pl.r : ''}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}