import { type MatchResult, type Scorer } from '../lib/engine';

interface Props {
  seed: number;
  result: MatchResult;
  scorers: Scorer[];
  onReset: () => void;
}

/* The result of your drafted XI. Scoreline in gold, scorers below.
   The seed is shown so the run is identifiable / shareable. */
export function ResultCard({ seed, result, scorers, onReset }: Props) {
  // Tally goals per name so a brace reads "Riquelme ×2".
  const tally = scorers.reduce<Record<string, number>>((acc, s) => {
    acc[s.n] = (acc[s.n] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className={`card ${result.isPerfect ? 'card--perfect' : ''}`}>
      <p className="card-club">Semilla {seed.toString(36)}</p>

      <div className="scoreline">
        <span className="score">{result.gf}</span>
        <span className="score-sep">–</span>
        <span className="score score--away">{result.ga}</span>
      </div>

      {result.isPerfect && <p className="perfect-tag">7–0 Místico</p>}

      <div className="scorers">
        <h3 className="scorers-title">Goleadores</h3>
        {scorers.length === 0 ? (
          <p className="scorers-empty">Sin goles. Otra semilla será.</p>
        ) : (
          <ul>
            {Object.entries(tally).map(([name, n]) => (
              <li key={name}>
                {name}
                {n > 1 ? ` ×${n}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="power">Potencia del once: {result.power}</p>

      <button className="cta" onClick={onReset}>
        Jugar de nuevo
      </button>
    </section>
  );
}