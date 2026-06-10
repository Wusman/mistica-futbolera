import { type CSSProperties, useReducer } from 'react';
import { type Player, type FormationName, TEAMS } from './data/players';
import {
  type Lineup,
  type Attitude,
  type Shootout,
  type PenAim,
  emptyLineup,
  lineupFilled,
  lineupXI,
  playHalf,
  penKick,
  oppPenKick,
  shootoutWinner,
  pickOpponent,
  scaledRivalOf,
  halfEvents,
  avg,
} from './lib/engine';
import {
  type Stage,
  type Stats,
  type MatchView,
  type Campaign,
  type Sub,
  LADDER,
  isGroup,
  emptyStats,
} from './lib/tournament';
import { useT, useLocale } from './i18n';
import { LangSwitch } from './components/LangSwitch';
import { SetupStep } from './components/SetupStep';
import { BuildStep } from './components/BuildStep';
import { MatchStep } from './components/MatchStep';
import { TournamentStep } from './components/TournamentStep';
import { PenaltyShootout } from './components/PenaltyShootout';

const newSeed = () => Math.floor(Math.random() * 0xffffffff);
const STARTING_PASSES = 3;

/* Ritmo del relato: grupos ágiles, eliminatorias con más drama. */
const tickerSecsFor = (stage: Stage) => (isGroup(stage) ? 4.2 : 5.4);

/* Seed tint, constrained to the "European night" band (azul → violeta).
   Full 0–360 produced greens/reds that broke the identity; this keeps every
   seed inside the brand while still feeling unique. Deterministic. */
const seedHue = (seed: number) => 205 + (seed % 61);

type Phase =
  | { kind: 'setup' }
  | { kind: 'drafting'; step: number; lineup: Lineup; passes: number }
  | { kind: 'campaign'; c: Campaign };

interface GameState { seed: number; formation: FormationName; phase: Phase; }

type Action =
  | { type: 'SET_FORMATION'; formation: FormationName }
  | { type: 'NEW_SEED'; seed: number }
  | { type: 'START' }
  | { type: 'PICK'; player: Player; slot: number }
  | { type: 'SKIP' }
  | { type: 'PASS' }
  | { type: 'ENTER' }
  | { type: 'KICKOFF' }
  | { type: 'DECIDE'; attitude: Attitude }
  | { type: 'KICK'; aim: PenAim }
  | { type: 'PENS_DONE' }
  | { type: 'NEXT' }
  | { type: 'GO_HOME' }
  | { type: 'RESET'; seed: number };

const init = (): GameState => ({ seed: newSeed(), formation: '4-3-3', phase: { kind: 'setup' } });

const teamById = (id: string) => TEAMS.find((t) => t.id === id)!;
const matchSeedFor = (seed: number, stageIdx: number) => (seed ^ ((stageIdx + 1) * 0x85ebca6b)) >>> 0;

/* Liquidar un partido decidido: stats, pool vivo, puntos de grupo y done.
   Lo usan DECIDE (resultados directos) y PENS_DONE (tras la tanda). */
function settleMatch(
  c: Campaign,
  stage: Stage,
  m: MatchView,
): Pick<Campaign, 'pool' | 'groupPts' | 'stats' | 'sub' | 'done'> {
  const goals = { ...c.stats.goals };
  for (const s of m.scorers) goals[s.n] = (goals[s.n] ?? 0) + 1;
  const stats: Stats = {
    pj: c.stats.pj + 1,
    w: c.stats.w + (m.outcome === 'W' ? 1 : 0),
    d: c.stats.d + (m.outcome === 'D' ? 1 : 0),
    l: c.stats.l + (m.outcome === 'L' ? 1 : 0),
    gf: c.stats.gf + m.gf,
    ga: c.stats.ga + m.ga,
    cs: c.stats.cs + (m.ga === 0 ? 1 : 0),
    goals,
  };

  const pool = m.outcome === 'W' ? c.pool.filter((id) => id !== c.oppId) : c.pool;
  const groupPts = c.groupPts + (isGroup(stage) ? (m.outcome === 'W' ? 3 : m.outcome === 'D' ? 1 : 0) : 0);

  let done: Campaign['done'];
  if (stage === 'g2') {
    if (groupPts < 3) done = { champion: false, stage };
  } else if (!isGroup(stage)) {
    if (m.outcome === 'L') done = { champion: false, stage };
    else if (stage === 'final') done = { champion: true, stage };
  }

  return { pool, groupPts, stats, sub: { k: 'fulltime', m }, done };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_FORMATION':
      return { ...state, formation: action.formation };
    case 'NEW_SEED':
      return { ...state, seed: action.seed };
    case 'START':
      return { ...state, phase: { kind: 'drafting', step: 0, lineup: emptyLineup(state.formation), passes: STARTING_PASSES } };

    case 'PICK': {
      if (state.phase.kind !== 'drafting') return state;
      const { step, lineup, passes } = state.phase;
      if (lineup.some((cell) => cell?.i === action.player.i)) return state;
      if (action.slot < 0 || lineup[action.slot] !== null) return state;
      const next = lineup.slice();
      next[action.slot] = action.player;
      return { ...state, phase: { kind: 'drafting', step: step + 1, lineup: next, passes } };
    }
    case 'SKIP': {
      if (state.phase.kind !== 'drafting') return state;
      return { ...state, phase: { ...state.phase, step: state.phase.step + 1 } };
    }
    case 'PASS': {
      if (state.phase.kind !== 'drafting' || state.phase.passes <= 0) return state;
      return { ...state, phase: { ...state.phase, step: state.phase.step + 1, passes: state.phase.passes - 1 } };
    }

    case 'ENTER': {
      if (state.phase.kind !== 'drafting' || !lineupFilled(state.phase.lineup)) return state;
      const xi = lineupXI(state.phase.lineup);
      const pool = TEAMS.map((t) => t.id);
      const oppId = pickOpponent(matchSeedFor(state.seed, 0), pool);
      const c: Campaign = { xi, stageIdx: 0, oppId, pool, groupPts: 0, stats: emptyStats(), sub: { k: 'preview' } };
      return { ...state, phase: { kind: 'campaign', c } };
    }

    case 'KICKOFF': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'preview') return state;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      const h1 = playHalf(ms, 1, c.xi, ov, 'eq');
      const ev1 = halfEvents(ms, 1, h1);
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { k: 'half', gf1: h1.gf, ga1: h1.ga, sc1: h1.scorers, ev1 } } } };
    }

    case 'DECIDE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'half') return state;
      const { gf1, ga1, sc1, ev1 } = c.sub;

      const stage: Stage = LADDER[c.stageIdx];
      const opp = teamById(c.oppId);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      const ms = matchSeedFor(state.seed, c.stageIdx);
      const h2 = playHalf(ms, 2, c.xi, ov, action.attitude);

      const gf = Math.min(9, gf1 + h2.gf);
      const ga = Math.min(9, ga1 + h2.ga);
      const scorers = [...sc1, ...h2.scorers];

      /* Eventos del relato (con minuto). Si el tope de 9 recortó goles,
         recortamos los eventos sobrantes para que relato y marcador coincidan. */
      let cy = 0, co = 0;
      const ev = [...ev1, ...halfEvents(ms, 2, h2)].filter((e) =>
        e.side === 'you' ? ++cy <= gf : ++co <= ga,
      );

      /* Empate en eliminatorias → tanda interactiva: el partido queda
         congelado en 'pens' y NO se liquida hasta que la tanda termine. */
      if (!isGroup(stage) && gf === ga) {
        const sub: Sub = { k: 'pens', gf, ga, scorers, ev, you: [], opp: [] };
        return { ...state, phase: { kind: 'campaign', c: { ...c, sub } } };
      }

      const outcome: 'W' | 'D' | 'L' = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
      const m: MatchView = { oppId: c.oppId, oppName: opp.name, oppEdition: opp.edition, gf, ga, scorers, ev, outcome };
      return { ...state, phase: { kind: 'campaign', c: { ...c, ...settleMatch(c, stage, m) } } };
    }

    case 'KICK': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'pens' || c.sub.winner) return state;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      const xa = avg(c.xi);

      const you = [...c.sub.you, penKick(ms, c.sub.you.length, action.aim, xa, ov)];
      let oppArr = c.sub.opp;
      let winner = shootoutWinner(you.map((k) => k.scored), oppArr) ?? undefined;
      if (!winner) {
        oppArr = [...oppArr, oppPenKick(ms, oppArr.length, xa, ov)];
        winner = shootoutWinner(you.map((k) => k.scored), oppArr) ?? undefined;
      }
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { ...c.sub, you, opp: oppArr, winner } } } };
    }

    case 'PENS_DONE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'pens' || !c.sub.winner) return state;
      const stage: Stage = LADDER[c.stageIdx];
      const opp = teamById(c.oppId);
      const pens: Shootout = {
        you: c.sub.you.filter((k) => k.scored).length,
        opp: c.sub.opp.filter(Boolean).length,
      };
      const outcome: 'W' | 'L' = c.sub.winner === 'you' ? 'W' : 'L';
      const m: MatchView = {
        oppId: c.oppId, oppName: opp.name, oppEdition: opp.edition,
        gf: c.sub.gf, ga: c.sub.ga, scorers: c.sub.scorers, ev: c.sub.ev, pens, outcome,
      };
      return { ...state, phase: { kind: 'campaign', c: { ...c, ...settleMatch(c, stage, m) } } };
    }

    case 'NEXT': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'fulltime' || c.done) return state;
      const nextIdx = c.stageIdx + 1;
      const ms = matchSeedFor(state.seed, nextIdx);
      const candidates = c.pool.filter((id) => id !== c.oppId);
      const oppId = pickOpponent(ms, candidates.length ? candidates : c.pool);
      return { ...state, phase: { kind: 'campaign', c: { ...c, stageIdx: nextIdx, oppId, sub: { k: 'preview' } } } };
    }

    case 'GO_HOME':
      /* Conserva semilla y formación: por determinismo, la misma semilla +
         las mismas decisiones reproducen la corrida si querés volver. */
      return { ...state, phase: { kind: 'setup' } };

    case 'RESET':
      return { seed: action.seed, formation: state.formation, phase: { kind: 'setup' } };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const t = useT();
  const { locale } = useLocale();
  const rootStyle = { '--seed-hue': String(seedHue(state.seed)) } as CSSProperties;

  const phase = state.phase;

  const goHome = () => {
    if (phase.kind === 'setup') return;
    if (window.confirm(t('nav.leave'))) dispatch({ type: 'GO_HOME' });
  };

  const playNow = () => {
    if (phase.kind !== 'setup' && !window.confirm(t('nav.leave'))) return;
    dispatch({ type: 'START' });
  };

  return (
    <div className="app" style={rootStyle}>
      <div className="backdrop" aria-hidden="true" />

      <header className="masthead">
        <h1>
          <button className="brand" onClick={goHome}>Mística Futbolera</button>
        </h1>
        <div className="masthead-side">
          <LangSwitch />
          {phase.kind !== 'setup' && <p className="tagline">{t('tagline')}</p>}
        </div>
      </header>

      <main className="stage">
        {phase.kind === 'setup' && (
        <SetupStep
          formation={state.formation}
          seed={state.seed}
          onFormation={(formation) => dispatch({ type: 'SET_FORMATION', formation })}
          onNewSeed={() => dispatch({ type: 'NEW_SEED', seed: newSeed() })}
          onSetSeed={(seed) => dispatch({ type: 'NEW_SEED', seed })}
          onStart={() => dispatch({ type: 'START' })}
        />
      )}

      {phase.kind === 'drafting' && (
        <BuildStep
          seed={state.seed}
          step={phase.step}
          lineup={phase.lineup}
          passes={phase.passes}
          formation={state.formation}
          onPick={(player, slot) => dispatch({ type: 'PICK', player, slot })}
          onSkip={() => dispatch({ type: 'SKIP' })}
          onPass={() => dispatch({ type: 'PASS' })}
          onSimulate={() => dispatch({ type: 'ENTER' })}
        />
      )}

      {phase.kind === 'campaign' && phase.c.sub.k === 'half' && (
        <MatchStep
          key={phase.c.stageIdx}
          rival={scaledRivalOf(teamById(phase.c.oppId), phase.c.stageIdx)}
          gf1={phase.c.sub.gf1}
          ga1={phase.c.sub.ga1}
          ev1={phase.c.sub.ev1}
          tickerSecs={tickerSecsFor(LADDER[phase.c.stageIdx])}
          onDecide={(attitude) => dispatch({ type: 'DECIDE', attitude })}
        />
      )}

      {phase.kind === 'campaign' && phase.c.sub.k === 'pens' && (
        <PenaltyShootout
          key={phase.c.stageIdx}
          stageLabel={t('stage.' + LADDER[phase.c.stageIdx])}
          oppName={teamById(phase.c.oppId).name}
          gf={phase.c.sub.gf}
          ga={phase.c.sub.ga}
          ev={phase.c.sub.ev}
          you={phase.c.sub.you}
          opp={phase.c.sub.opp}
          winner={phase.c.sub.winner}
          tickerSecs={tickerSecsFor(LADDER[phase.c.stageIdx])}
          onKick={(aim) => dispatch({ type: 'KICK', aim })}
          onDone={() => dispatch({ type: 'PENS_DONE' })}
        />
      )}

      {phase.kind === 'campaign' && (phase.c.sub.k === 'preview' || phase.c.sub.k === 'fulltime') && (
        <TournamentStep
          campaign={phase.c}
          stageLabel={t('stage.' + LADDER[phase.c.stageIdx])}
          xiAvg={Math.round(avg(phase.c.xi))}
          opp={teamById(phase.c.oppId)}
          onKickoff={() => dispatch({ type: 'KICKOFF' })}
          onNext={() => dispatch({ type: 'NEXT' })}
          onReset={() => dispatch({ type: 'RESET', seed: newSeed() })}
        />
      )}
      </main>

      <footer className="footer">
        <button className="footer-brand" onClick={goHome}>Mística Futbolera</button>
        <button className="footer-tag" onClick={playNow}>{t('footer.tag')}</button>
        <nav className="footer-links">
          <a href={locale === 'es' ? '/privacidad.html' : '/privacidad.html#en'}>{t('footer.privacy')}</a>
        </nav>
      </footer>
    </div>
  );
}