import { type CSSProperties } from 'react';
import { type Team } from '../data/players';
import { type Campaign, type Stage } from '../lib/tournament';
import { rivalOf } from '../lib/engine';

interface Props {
  campaign: Campaign;
  stageLabel: string;
  xiAvg: number;
  opp: Team;
  onKickoff: () => void;
  onNext: () => void;
  onReset: () => void;
}

const OUT_MSG: Record<Stage, string> = {
  g1: 'Afuera en fase de grupos. Papelón.',
  g2: 'Afuera en fase de grupos. Papelón.',
  r16: 'Eliminado en Octavos.',
  qf: 'Eliminado en Cuartos.',
  sf: 'Tan cerca… Caíste en Semis. Te moriste en la orilla.',
  final: 'Subcampeón. Perdiste LA final.',
};

function topScorer(goals: Record<string, number>): string {
  const e = Object.entries(goals).sort((a, b) => b[1] - a[1])[0];
  return e ? `${e[0]} (${e[1]})` : '—';
}

export function TournamentStep({ campaign: c, stageLabel, xiAvg, opp, onKickoff, onNext, onReset }: Props) {
  const s = c.stats;
  const record = `PJ ${s.pj} · ${s.w}G ${s.d}E ${s.l}P · GF ${s.gf} GA ${s.ga}`;

  /* ── Campaign over ── */
  if (c.sub.k === 'fulltime' && c.done) {
    const champ = c.done.champion;
    return (
      <section className={`card ${champ ? 'card--perfect' : ''}`}>
        <p className="card-club">{champ ? 'Mística Futbolera' : stageLabel}</p>
        {champ ? (
          <p className="perfect-tag">¡Campeón de Europa!</p>
        ) : (
          <p className="verdict">{OUT_MSG[c.done.stage]}</p>
        )}
        <div className="scorers">
          <h3 className="scorers-title">Tu campaña</h3>
          <ul>
            <li>Partidos: {s.pj} · {s.w}G {s.d}E {s.l}P</li>
            <li>Goles: {s.gf} a favor, {s.ga} en contra</li>
            <li>Vallas invictas: {s.cs}</li>
            <li>Goleador: {topScorer(s.goals)}</li>
          </ul>
        </div>
        <button className="cta" onClick={onReset}>Jugar de nuevo</button>
      </section>
    );
  }

  /* ── Full-time of a match (advance) ── */
  if (c.sub.k === 'fulltime') {
    const m = c.sub.m;
    const label = m.outcome === 'W' ? 'Victoria' : m.outcome === 'L' ? 'Derrota' : 'Empate';
    return (
      <section className="card">
        <p className="card-club">{stageLabel}</p>
        <div className="scoreline">
          <span className="score">{m.gf}</span>
          <span className="score-sep">–</span>
          <span className="score score--away">{m.ga}</span>
        </div>
        <p className="vs">Tu once vs {m.oppName} · {m.oppEdition}</p>
        {m.pens && <p className="perfect-tag">Penales {m.pens.you}–{m.pens.opp}</p>}
        <p className="verdict">{label}</p>
        {m.scorers.length > 0 && (
          <div className="scorers">
            <h3 className="scorers-title">Tus goles</h3>
            <ul>{m.scorers.map((sc, k) => <li key={k}>{sc.n}</li>)}</ul>
          </div>
        )}
        <button className="cta" onClick={onNext}>Siguiente ronda</button>
      </section>
    );
  }

  /* ── Preview / scouting before kickoff ── */
  const r = rivalOf(opp);
  const bars = { '--club': opp.colors[0] } as CSSProperties;
  const inGroup = stageLabel.startsWith('Grupo');
  return (
    <section className="match">
      <p className="match-tag">{stageLabel}</p>
      <p className="tour-record">{record}</p>

      <div className="scout" style={bars}>
        <div className="club-colors">
          {opp.colors.map((col, k) => <span key={k} style={{ background: col }} />)}
        </div>
        <span className="scout-name">{opp.name} · {opp.edition}</span>
        <div className="scout-bars">
          <span>Ataque <b>{r.atk}</b></span>
          <span>Defensa <b>{r.def}</b></span>
          <span>Media <b>{r.overall}</b></span>
        </div>
      </div>

      <p className="match-note">
        Tu media: <b>{xiAvg}</b>
        {inGroup ? ` · Puntos: ${c.groupPts} (necesitás 3 para avanzar)` : ''}
      </p>

      <button className="cta" onClick={onKickoff}>Jugar partido</button>
    </section>
  );
}