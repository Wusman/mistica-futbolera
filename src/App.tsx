import { useReducer } from 'react';
import { FORMATIONS, type Player, type FormationName } from './data/players';
import {
  type MatchResult,
  type Scorer,
  resolveMatch,
  validateXI,
} from './lib/engine';
import { SetupStep } from './components/SetupStep';
import { BuildStep } from './components/BuildStep';
import { ResultCard } from './components/ResultCard';

const newSeed = () => Math.floor(Math.random() * 0xffffffff);

/* ── State machine ───────────────────────────────────────────
   One value for the whole loop, as a tagged union so illegal
   states can't exist. The draft lives entirely in `step` + `picks`:
   the champion offered right now is derived from (seed, step). */
type Phase =
  | { kind: 'setup' }
  | { kind: 'drafting'; step: number; picks: Player[] }
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
  | { type: 'PICK'; player: Player }
  | { type: 'SKIP' }
  | { type: 'SIMULATE' }
  | { type: 'RESET'; seed: number };

const init = (): GameState => ({
  seed: newSeed(),
  formation: '4-3-3',
  phase: { kind: 'setup' },
});

/* Pure reducer: no randomness inside. Seeds are minted in the shell
   (the handlers below) and passed in via actions. */
function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_FORMATION':
      return { ...state, formation: action.formation };

    case 'NEW_SEED':
      return { ...state, seed: action.seed };

    case 'START':
      return { ...state, phase: { kind: 'drafting', step: 0, picks: [] } };

    case 'PICK': {
      if (state.phase.kind !== 'drafting') return state;
      const need = FORMATIONS[state.formation];
      const { step, picks } = state.phase;
      // Can't overfill a position bucket — that's "no repetir posición".
      const filled = picks.filter((p) => p.p === action.player.p).length;
      if (filled >= need[action.player.p]) return state;
      return {
        ...state,
        phase: { kind: 'drafting', step: step + 1, picks: [...picks, action.player] },
      };
    }

    case 'SKIP': {
      // Only used when the offered champion has nobody you can field.
      if (state.phase.kind !== 'drafting') return state;
      return {
        ...state,
        phase: { ...state.phase, step: state.phase.step + 1 },
      };
    }

    case 'SIMULATE': {
      if (state.phase.kind !== 'drafting') return state;
      if (!validateXI(state.phase.picks, state.formation)) return state; // guard
      const { result, scorers } = resolveMatch(state.seed, state.phase.picks);
      return {
        ...state,
        phase: { kind: 'result', xi: state.phase.picks, result, scorers },
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
        <p className="tagline">Drafteá tu once mítico. Buscá ser el verdadero rey de copas.</p>
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
          picks={state.phase.picks}
          formation={state.formation}
          onPick={(player) => dispatch({ type: 'PICK', player })}
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