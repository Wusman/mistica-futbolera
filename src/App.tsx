import { useReducer } from 'react';
import { type Player, type FormationName } from './data/players';
import {
  type MatchResult,
  type Scorer,
  type Lineup,
  emptyLineup,
  lineupFilled,
  lineupXI,
  resolveMatch,
} from './lib/engine';
import { SetupStep } from './components/SetupStep';
import { BuildStep } from './components/BuildStep';
import { ResultCard } from './components/ResultCard';

const newSeed = () => Math.floor(Math.random() * 0xffffffff);

type Phase =
  | { kind: 'setup' }
  | { kind: 'drafting'; step: number; lineup: Lineup }
  | { kind: 'result'; xi: Player[]; result: MatchResult; scorers: Scorer[] };

interface GameState {
  seed: number;
  formation: FormationName;
  phase: Phase;
}

type Action =
  | { type: 'SET_FORMATION'; formation: FormationName }
  | { type: 'NEW_SEED'; seed: number }
  | { type: 'START' }
  | { type: 'PICK'; player: Player; slot: number } // slot chosen in the UI
  | { type: 'SKIP' }
  | { type: 'SIMULATE' }
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
        phase: { kind: 'drafting', step: 0, lineup: emptyLineup(state.formation) },
      };

    case 'PICK': {
      if (state.phase.kind !== 'drafting') return state;
      const { step, lineup } = state.phase;
      // Can't pick the same player twice, and the target slot must be open.
      if (lineup.some((cell) => cell?.i === action.player.i)) return state;
      if (action.slot < 0 || lineup[action.slot] !== null) return state;
      const next = lineup.slice();
      next[action.slot] = action.player;
      return { ...state, phase: { kind: 'drafting', step: step + 1, lineup: next } };
    }

    case 'SKIP': {
      if (state.phase.kind !== 'drafting') return state;
      return { ...state, phase: { ...state.phase, step: state.phase.step + 1 } };
    }

    case 'SIMULATE': {
      if (state.phase.kind !== 'drafting') return state;
      if (!lineupFilled(state.phase.lineup)) return state;
      const xi = lineupXI(state.phase.lineup);
      const { result, scorers } = resolveMatch(state.seed, xi);
      return { ...state, phase: { kind: 'result', xi, result, scorers } };
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
        <p className="tagline">Drafteá tu once mítico. alcanza la gloria.</p>
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
          formation={state.formation}
          onPick={(player, slot) => dispatch({ type: 'PICK', player, slot })}
          onSkip={() => dispatch({ type: 'SKIP' })}
          onSimulate={() => dispatch({ type: 'SIMULATE' })}
        />
      )}

      {state.phase.kind === 'result' && (
        <ResultCard
          seed={state.seed}
          result={state.phase.result}
          scorers={state.phase.scorers}
          onReset={() => dispatch({ type: 'RESET', seed: newSeed() })}
        />
      )}
    </div>
  );
}