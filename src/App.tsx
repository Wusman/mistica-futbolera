import { useReducer } from 'react';
import { type Player, type FormationName } from './data/players';
import {
  type MatchResult,
  type Scorer,
  type Lineup,
  type Attitude,
  type Rival,
  emptyLineup,
  lineupFilled,
  lineupXI,
  playHalf,
  rivalFor,
} from './lib/engine';
import { SetupStep } from './components/SetupStep';
import { BuildStep } from './components/BuildStep';
import { MatchStep } from './components/MatchStep';
import { ResultCard } from './components/ResultCard';

const newSeed = () => Math.floor(Math.random() * 0xffffffff);
const STARTING_PASSES = 3;

type Phase =
  | { kind: 'setup' }
  | { kind: 'drafting'; step: number; lineup: Lineup; passes: number }
  | { kind: 'halftime'; xi: Player[]; rival: Rival; gf1: number; ga1: number; scorers1: Scorer[] }
  | { kind: 'result'; xi: Player[]; result: MatchResult; scorers: Scorer[]; attitude: Attitude };

interface GameState {
  seed: number;
  formation: FormationName;
  phase: Phase;
}

type Action =
  | { type: 'SET_FORMATION'; formation: FormationName }
  | { type: 'NEW_SEED'; seed: number }
  | { type: 'START' }
  | { type: 'PICK'; player: Player; slot: number }
  | { type: 'SKIP' } // forced (nobody fits), free
  | { type: 'PASS' } // voluntary, costs a pass
  | { type: 'SIMULATE' }
  | { type: 'DECIDE'; attitude: Attitude }
  | { type: 'RESET'; seed: number };

const init = (): GameState => ({
  seed: newSeed(),
  formation: '4-3-3',
  phase: { kind: 'setup' },
});

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_FORMATION':
      return { ...state, formation: action.formation };

    case 'NEW_SEED':
      return { ...state, seed: action.seed };

    case 'START':
      return {
        ...state,
        phase: { kind: 'drafting', step: 0, lineup: emptyLineup(state.formation), passes: STARTING_PASSES },
      };

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
      return {
        ...state,
        phase: { ...state.phase, step: state.phase.step + 1, passes: state.phase.passes - 1 },
      };
    }

    case 'SIMULATE': {
      if (state.phase.kind !== 'drafting') return state;
      if (!lineupFilled(state.phase.lineup)) return state;
      const xi = lineupXI(state.phase.lineup);
      const h1 = playHalf(state.seed, 1, xi, 'eq'); // first half neutral
      const rival = rivalFor(state.seed);
      return {
        ...state,
        phase: { kind: 'halftime', xi, rival, gf1: h1.gf, ga1: h1.ga, scorers1: h1.scorers },
      };
    }

    case 'DECIDE': {
      if (state.phase.kind !== 'halftime') return state;
      const { xi, rival, gf1, ga1, scorers1 } = state.phase;
      const h2 = playHalf(state.seed, 2, xi, action.attitude);
      const gf = Math.min(9, gf1 + h2.gf);
      const ga = Math.min(9, ga1 + h2.ga);
      const power = Math.round(xi.reduce((s, p) => s + p.r, 0) / xi.length);
      const result: MatchResult = {
        gf,
        ga,
        power,
        isPerfect: gf >= 7 && ga === 0,
        opp: `${rival.name} · ${rival.edition}`,
      };
      return {
        ...state,
        phase: { kind: 'result', xi, result, scorers: [...scorers1, ...h2.scorers], attitude: action.attitude },
      };
    }

    case 'RESET':
      return { seed: action.seed, formation: state.formation, phase: { kind: 'setup' } };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  return (
    <div className="app">
      <header className="masthead">
        <h1>Mística Futbolera</h1>
        <p className="tagline">Drafteá tu once mítico. Buscá el 7–0.</p>
      </header>

      {state.phase.kind === 'setup' && (
        <SetupStep
          formation={state.formation}
          seed={state.seed}
          onFormation={(formation) => dispatch({ type: 'SET_FORMATION', formation })}
          onNewSeed={() => dispatch({ type: 'NEW_SEED', seed: newSeed() })}
          onStart={() => dispatch({ type: 'START' })}
        />
      )}

      {state.phase.kind === 'drafting' && (
        <BuildStep
          seed={state.seed}
          step={state.phase.step}
          lineup={state.phase.lineup}
          passes={state.phase.passes}
          formation={state.formation}
          onPick={(player, slot) => dispatch({ type: 'PICK', player, slot })}
          onSkip={() => dispatch({ type: 'SKIP' })}
          onPass={() => dispatch({ type: 'PASS' })}
          onSimulate={() => dispatch({ type: 'SIMULATE' })}
        />
      )}

      {state.phase.kind === 'halftime' && (
        <MatchStep
          rival={state.phase.rival}
          gf1={state.phase.gf1}
          ga1={state.phase.ga1}
          onDecide={(attitude) => dispatch({ type: 'DECIDE', attitude })}
        />
      )}

      {state.phase.kind === 'result' && (
        <ResultCard
          seed={state.seed}
          result={state.phase.result}
          scorers={state.phase.scorers}
          attitude={state.phase.attitude}
          onReset={() => dispatch({ type: 'RESET', seed: newSeed() })}
        />
      )}
    </div>
  );
}