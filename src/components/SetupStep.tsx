import { FORMATIONS, type FormationName } from '../data/players';
import { POS_LABEL } from '../labels';

interface Props {
  formation: FormationName;
  seed: number;
  onFormation: (f: FormationName) => void;
  onNewSeed: () => void;
  onStart: () => void;
}

export function SetupStep({ formation, seed, onFormation, onNewSeed, onStart }: Props) {
  const names = Object.keys(FORMATIONS) as FormationName[];
  const slots = FORMATIONS[formation].slots;

  return (
    <section className="setup">
      <div className="setup-side">
        <h2 className="step-title">1 · Formación</h2>
        <div className="formation-grid">
          {names.map((name) => (
            <button
              key={name}
              className={`chip ${name === formation ? 'chip--on' : ''}`}
              onClick={() => onFormation(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <h2 className="step-title">2 · Semilla</h2>
        <div className="seed-row">
          <code className="seed-pill">{seed.toString(36)}</code>
          <button className="cta cta--ghost" onClick={onNewSeed}>
            Nueva
          </button>
        </div>

        <button className="cta" onClick={onStart}>
          Empezar draft
        </button>
      </div>

      <div className="setup-board">
        <div className="pitch">
          {slots.map((slot, i) => (
            <div
              key={i}
              className="pslot pslot--empty"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <span className="pslot-pos">{POS_LABEL[slot.pos]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}