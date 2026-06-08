import { type Attitude, type Rival } from '../lib/engine';

interface Props {
  rival: Rival;
  gf1: number;
  ga1: number;
  onDecide: (a: Attitude) => void;
}

const OPTIONS: { key: Attitude; label: string; note: string }[] = [
  { key: 'def', label: 'Defensivo', note: 'Aguantás el resultado. Concedés menos, pero casi no atacás.' },
  { key: 'eq', label: 'Equilibrado', note: 'Sin cambios. Dejás que el partido fluya.' },
  { key: 'off', label: 'Ofensivo', note: 'Vas por todo. Más chances de gol, pero te exponés atrás.' },
];

export function MatchStep({ rival, gf1, ga1, onDecide }: Props) {
  const lead = gf1 - ga1;
  const note =
    lead > 0
      ? 'Vas ganando. ¿Lo liquidás o lo cuidás?'
      : lead < 0
        ? 'Vas perdiendo. Hay que salir a buscarlo.'
        : 'Todo igualado. Vos definís el partido.';

  return (
    <section className="match">
      <p className="match-tag">Entretiempo</p>

      <div className="scoreline">
        <span className="score">{gf1}</span>
        <span className="score-sep">–</span>
        <span className="score score--away">{ga1}</span>
      </div>

      <div className="scout">
        <span className="scout-name">{rival.name} · {rival.edition}</span>
        <div className="scout-bars">
          <span>Ataque rival <b>{rival.atk}</b></span>
          <span>Defensa rival <b>{rival.def}</b></span>
        </div>
      </div>

      <p className="match-note">{note}</p>

      <div className="attitudes">
        {OPTIONS.map((o) => (
          <button key={o.key} className="att-btn" onClick={() => onDecide(o.key)}>
            <b>{o.label}</b>
            <span>{o.note}</span>
          </button>
        ))}
      </div>
    </section>
  );
}