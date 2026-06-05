import { type CSSProperties } from 'react';
import { FORMATIONS, type FormationName, type Player, type Pos } from '../data/players';
import { draftTeamAt, validateXI } from '../lib/engine';

const ORDER: Pos[] = ['GK', 'DF', 'MF', 'FW'];
const LABEL: Record<Pos, string> = {
  GK: 'Arco',
  DF: 'Defensa',
  MF: 'Medio',
  FW: 'Ataque',
};

interface Props {
  seed: number;
  step: number;
  picks: Player[];
  formation: FormationName;
  onPick: (p: Player) => void;
  onSkip: () => void;
  onSimulate: () => void;
}

/* The draft. A champion is offered (derived from seed + step); you pick
   ONE of its players into an open position slot. Picking advances the
   step, which draws the next champion. The XI grows until it's full. */
export function BuildStep({
  seed,
  step,
  picks,
  formation,
  onPick,
  onSkip,
  onSimulate,
}: Props) {
  const need = FORMATIONS[formation];
  const team = draftTeamAt(seed, step); // the champion offered right now

  const filledBy = (pos: Pos) => picks.filter((p) => p.p === pos).length;
  const bucketOpen = (pos: Pos) => filledBy(pos) < need[pos];

  // Players from this champion who still fit AND aren't already in your XI.
  const taken = new Set(picks.map((p) => p.i));
  const eligible = team.players.filter((p) => bucketOpen(p.p) && !taken.has(p.i));

  const ready = validateXI(picks, formation);
  const overall = picks.length
    ? Math.round(picks.reduce((sum, p) => sum + p.r, 0) / picks.length)
    : 0;

  const bannerStyle = { '--club': team.color } as CSSProperties;

  return (
    <section className="step">
      <header className="draft-head">
        <span className="draft-step">
          Selección {Math.min(picks.length + 1, 11)} de 11
        </span>
        <span className="overall-inline">Media {overall}</span>
      </header>

      {/* Your XI as it grows — one row per line, slots fill in. */}
      <div className="squad">
        {ORDER.map((pos) => {
          const chosen = picks.filter((p) => p.p === pos);
          const empties = need[pos] - chosen.length;
          return (
            <div key={pos} className="squad-line">
              <span className="squad-pos">{LABEL[pos]}</span>
              <div className="slots">
                {chosen.map((p) => (
                  <span key={p.i} className="slot slot--filled">
                    {p.n}
                  </span>
                ))}
                {Array.from({ length: empties }).map((_, k) => (
                  <span key={`e${k}`} className="slot slot--empty">
                    —
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* The champion on offer (hidden once the XI is complete). */}
      {!ready && (
        <div className="draft-pick" style={bannerStyle}>
          <header className="draft-champ">
            <h2 className="club-name">{team.name}</h2>
            <p className="club-edition">{team.edition}</p>
          </header>

          {eligible.length > 0 ? (
            <ul className="players">
              {eligible.map((p) => (
                <li key={p.i}>
                  <button className="player" onClick={() => onPick(p)}>
                    <span className="player-name">{p.n}</span>
                    <span className="player-pos">{p.p}</span>
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