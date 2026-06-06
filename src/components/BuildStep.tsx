import { type CSSProperties, useState } from 'react';
import { FORMATIONS, type FormationName, type Player } from '../data/players';
import {
  type Lineup,
  draftTeamAt,
  openSlotsFor,
  lineupFilled,
} from '../lib/engine';

interface Props {
  seed: number;
  step: number;
  lineup: Lineup;
  formation: FormationName;
  onPick: (p: Player, slot: number) => void;
  onSkip: () => void;
  onSimulate: () => void;
}

// Short label for a player on the pitch (surname only, to fit the badge).
const surname = (name: string) => {
  const parts = name.replace(/"/g, '').split(' ');
  return parts[parts.length - 1];
};

/* The draft on a pitch. Pick a player; if they fit a single open slot
   they drop in, if they fit two open slots you choose which. */
export function BuildStep({
  seed,
  step,
  lineup,
  formation,
  onPick,
  onSkip,
  onSimulate,
}: Props) {
  const slots = FORMATIONS[formation].slots;
  const team = draftTeamAt(seed, step);
  const [pending, setPending] = useState<Player | null>(null);

  const taken = new Set(
    lineup.filter((c): c is Player => c !== null).map((p) => p.i),
  );
  const eligible = team.players.filter(
    (p) => !taken.has(p.i) && openSlotsFor(p, lineup, formation).length > 0,
  );

  const placed = lineup.filter((c): c is Player => c !== null);
  const overall = placed.length
    ? Math.round(placed.reduce((s, p) => s + p.r, 0) / placed.length)
    : 0;
  const ready = lineupFilled(lineup);

  // Slots to highlight while choosing where to drop a dual-position player.
  const choosable = pending ? openSlotsFor(pending, lineup, formation) : [];

  // Pick a player: one fitting slot → place now; several → ask which.
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

  const bannerStyle = { '--club': team.color } as CSSProperties;

  return (
    <section className="step">
      <header className="draft-head">
        <span className="draft-step">{placed.length} de 11</span>
        <span className="overall-inline">Media {overall}</span>
      </header>

      {/* ── The board (tablero) ── */}
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
                <span className="pslot-pos">{slot.pos}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── The champion on offer / the position chooser ── */}
      {!ready && (
        <div className="draft-pick" style={bannerStyle}>
          {pending ? (
            <div className="draft-none">
              <p className="choose-hint">¿Dónde ponés a {pending.n}? Tocá un puesto.</p>
              <button className="cta cta--ghost" onClick={() => setPending(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <header className="draft-champ">
                <h2 className="club-name">{team.name}</h2>
                <p className="club-edition">{team.edition}</p>
              </header>

              {eligible.length > 0 ? (
                <ul className="players">
                  {eligible.map((p) => (
                    <li key={p.i}>
                      <button className="player" onClick={() => handlePick(p)}>
                        <span className="player-name">{p.n}</span>
                        <span className="player-pos">{p.pos.join('/')}</span>
                        <span className="player-rating">{p.r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="draft-none">
                  <p>No te sirve nadie de este campeón.</p>
                  <button className="cta cta--ghost" onClick={onSkip}>
                    Sortear otro
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {ready && (
        <button className="cta" onClick={onSimulate}>
          Simular partido
        </button>
      )}
    </section>
  );
}