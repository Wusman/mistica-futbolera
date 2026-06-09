import { type CSSProperties, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FORMATIONS,
  TEAMS,
  type FormationName,
  type Player,
  type Pos,
} from '../data/players';
import { POS_LABEL } from '../labels';
import {
  type Lineup,
  draftTeamAt,
  openSlotsFor,
  lineupFilled,
} from '../lib/engine';
import { TeamReel } from './TeamReel';

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

const surname = (name: string) => {
  const parts = name.replace(/"/g, '').split(' ');
  return parts[parts.length - 1];
};

/* ── Tunables de la lista de jugadores (entrada escalonada) ──
   staggerChildren: ritmo entre cada jugador que aparece.
   y: cuántos px sube cada uno al entrar. */
const listV = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const itemV = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };
/* Respuesta táctil reutilizable: pegásela a cualquier <motion.button>. */
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
  const slots = FORMATIONS[formation].slots;
  const team = draftTeamAt(seed, step);
  const [pending, setPending] = useState<Player | null>(null);
  const [spinning, setSpinning] = useState(true);

  // Reset the reel + pending whenever a new champion is drawn (step changes).
  // Adjusting state during render on a prop change is React's recommended
  // alternative to calling setState inside an effect.
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

  // Team identity: left accent uses the primary color; the bar shows all 1–3.
  const bannerStyle = { '--club': team.colors[0] } as CSSProperties;

  return (
    <section className="board3">
      {/* ── Left: champion on offer + picks ── */}
      <div className="b3-pick">
        <header className="draft-head">
          <span className="draft-step">{placed.length} de 11</span>
          <span className="overall-inline">Media {overall}</span>
        </header>

        {!ready ? (
          <div className="draft-pick" style={bannerStyle}>
            {spinning ? (
              <TeamReel
                teams={TEAMS}
                target={team}
                spinKey={`${seed}:${step}`}
                label="Sorteando campeón…"
                onDone={() => setSpinning(false)}
              />
            ) : pending ? (
              <div className="draft-none">
                <p className="choose-hint">¿Dónde ponés a {pending.n}? Tocá un puesto.</p>
                <motion.button className="cta cta--ghost" {...tap} onClick={() => setPending(null)}>
                  Cancelar
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
                    <motion.ul
                      className="players"
                      key={team.id}
                      variants={listV}
                      initial="hidden"
                      animate="show"
                    >
                      {eligible.map((p) => (
                        <motion.li key={p.i} variants={itemV}>
                          <motion.button
                            className={`player ${p.r >= 88 ? 'player--crack' : ''}`}
                            {...tap}
                            onClick={() => handlePick(p)}
                          >
                            <span className="player-name">
                              {p.r >= 88 ? '★ ' : ''}
                              {p.n}
                            </span>
                            <span className="player-pos">{p.pos.map((x) => POS_LABEL[x]).join('/')}</span>
                            <span className="player-rating">{p.r}</span>
                          </motion.button>
                        </motion.li>
                      ))}
                    </motion.ul>
                    <div className="passes">
                      <span className="passes-count">Descartes: {passes}</span>
                      <motion.button className="cta cta--ghost" {...tap} disabled={passes <= 0} onClick={onPass}>
                        Pasar campeón
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="draft-none">
                    <p>No te sirve nadie de este campeón.</p>
                    <motion.button className="cta cta--ghost" {...tap} onClick={onSkip}>
                      Sortear otro (gratis)
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <motion.button className="cta" {...tap} onClick={onSimulate}>
            Simular partido
          </motion.button>
        )}
      </div>

      {/* ── Center: the board ── */}
      <div className="b3-board">
        <div className="pitch">
          {slots.map((slot, i) => {
            const player = lineup[i];
            const isChoosable = choosable.includes(i);
            const style: CSSProperties = { left: `${slot.x}%`, top: `${slot.y}%` };
            return (
              <div
                key={i}
                className={`pslot ${player ? 'pslot--filled' : 'pslot--empty'} ${
                  isChoosable ? 'pslot--choose' : ''
                }`}
                style={style}
                onClick={isChoosable ? () => placeAt(i) : undefined}
              >
                {player ? (
                  <>
                    <span className="pslot-name">{surname(player.n)}</span>
                    <span className="pslot-rating">{player.r}</span>
                  </>
                ) : (
                  <span className="pslot-pos">{POS_LABEL[slot.pos]}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: box score ── */}
      <div className="b3-list">
        <div className="bs-summary">
          <span>Ataque <b>{attack || '—'}</b></span>
          <span>Defensa <b>{defense || '—'}</b></span>
        </div>
        <ul className="boxscore">
          {slots.map((slot, i) => {
            const pl = lineup[i];
            return (
              <li key={i} className="bs-row">
                <span className="bs-pos">{POS_LABEL[slot.pos]}</span>
                <span className="bs-name">{pl ? surname(pl.n) : '—'}</span>
                <span className="bs-rat">{pl ? pl.r : ''}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}