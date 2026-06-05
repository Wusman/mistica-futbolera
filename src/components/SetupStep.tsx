import { FORMATIONS, type FormationName } from '../data/players';

interface Props {
  formation: FormationName;
  seed: number;
  onFormation: (f: FormationName) => void;
  onNewSeed: () => void;
  onStart: () => void;
}

/* Choose the formation (defines the 11 slots), see the seed that will
   drive the whole draft, then start. The seed is shown in base36 — the
   short, shareable form that the future share code will be built on. */
export function SetupStep({ formation, seed, onFormation, onNewSeed, onStart }: Props) {
  const names = Object.keys(FORMATIONS) as FormationName[];

  return (
    <section className="step">
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
    </section>
  );
}