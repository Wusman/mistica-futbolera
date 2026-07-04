import { type CSSProperties, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Player, type FormationName, TEAMS } from './data/players';
import {
  type Lineup,
  type Attitude,
  type Shootout,
  type PenAim,
  emptyLineup,
  lineupFilled,
  dailyRunSeed,
  lineupXI,
  playHalf,
  penKick,
  oppPenShot,
  shootoutWinner,
  pensTurn,
  bestXI,
  pickOpponent,
  scaledRivalOf,
  halfEvents,
  halfPenalty,
  addedTime,
  avg,
} from './lib/engine';
import {
  type Stage,
  type MatchView,
  type Campaign,
  type Sub,
  LADDER,
  isGroup,
  isTwoLegged,
  emptyStats,
  matchSeedFor,
  settleMatch,
  settleH2,
} from './lib/tournament';
import { useT, useLocale } from './i18n';
import { type DailyRecord, loadDaily, saveDaily, bumpStreak } from './lib/daily';
import { type RunLog, type RunResult, RUN_VERSION, playRun } from './lib/run';
import { encodeRun, decodeRun } from './lib/sharecode';
import { DailyDone } from './components/DailyDone';
import { SecondHalfPen } from './components/SecondHalfPen';
import { Feedback } from './components/Feedback';
import { LangSwitch } from './components/LangSwitch';
import { SetupStep } from './components/SetupStep';
import { BuildStep } from './components/BuildStep';
import { MatchStep } from './components/MatchStep';
import { TournamentStep } from './components/TournamentStep';
import { PenaltyShootout } from './components/PenaltyShootout';
import { Spectator } from './components/Spectator';

const newSeed = () => Math.floor(Math.random() * 0xffffffff);
const STARTING_PASSES = 3;

/* Ritmo del relato: grupos ágiles, eliminatorias con más drama. */
const tickerSecsFor = (stage: Stage) => (isGroup(stage) ? 4.2 : 5.4);

/* Seed tint, constrained to the "European night" band (azul → violeta).
   Full 0–360 produced greens/reds that broke the identity; this keeps every
   seed inside the brand while still feeling unique. Deterministic. */
const seedHue = (seed: number) => 205 + (seed % 61);

/* Captura de la corrida: las decisiones del jugador se anotan a medida que
   ocurren, para reproducir la corrida (share-code) y verificarla. Los saltos
   forzados del draft NO se anotan: playRun los reproduce solo. */
type RunInput = Pick<RunLog, 'draft' | 'attitudes' | 'penAims' | 'shoot'>;
const emptyRunInput = (): RunInput => ({ draft: [], attitudes: [], penAims: [], shoot: [] });

type Phase =
  | { kind: 'setup' }
  | { kind: 'drafting'; step: number; lineup: Lineup; passes: number }
  | { kind: 'campaign'; c: Campaign };

interface GameState { seed: number; formation: FormationName; phase: Phase; mode: 'free' | 'daily'; log: RunInput; }

type Action =
  | { type: 'SET_FORMATION'; formation: FormationName }
  | { type: 'NEW_SEED'; seed: number }
  | { type: 'START' }
  | { type: 'START_DAILY'; seed: number }
  | { type: 'PICK'; player: Player; slot: number }
  | { type: 'SKIP' }
  | { type: 'PASS' }
  | { type: 'ENTER' }
  | { type: 'KICKOFF' }
  | { type: 'DECIDE'; attitude: Attitude }
  | { type: 'HALF_PEN'; aim: PenAim }
  | { type: 'H2_PEN'; aim: PenAim }
  | { type: 'H2_DONE' }
  | { type: 'KICK'; aim: PenAim }
  | { type: 'DIVE'; aim: PenAim }
  | { type: 'PENS_DONE' }
  | { type: 'NEXT' }
  | { type: 'GO_HOME' }
  | { type: 'RESET'; seed: number };

const init = (): GameState => ({ seed: newSeed(), formation: '4-3-3', phase: { kind: 'setup' }, mode: 'free', log: emptyRunInput() });

const teamById = (id: string) => TEAMS.find((t) => t.id === id)!;

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_FORMATION':
      return { ...state, formation: action.formation };
    case 'NEW_SEED':
      return { ...state, seed: action.seed };
    case 'START':
      return { ...state, mode: 'free', phase: { kind: 'drafting', step: 0, lineup: emptyLineup(state.formation), passes: STARTING_PASSES }, log: emptyRunInput() };
    case 'START_DAILY':
      /* Torneo del día: misma semilla para todos hoy; UN intento (candado en
         localStorage al terminar). El reloj solo elige la semilla. */
      return { ...state, seed: action.seed, mode: 'daily', phase: { kind: 'drafting', step: 0, lineup: emptyLineup(state.formation), passes: STARTING_PASSES }, log: emptyRunInput() };

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
      const oppId = pickOpponent(matchSeedFor(state.seed, 0), pool, TEAMS, 0);
      const c: Campaign = { xi, stageIdx: 0, oppId, pool, groupPts: 0, stats: emptyStats(), sub: { k: 'preview' }, leg: 1 };
      return { ...state, phase: { kind: 'campaign', c } };
    }

    case 'KICKOFF': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'preview') return state;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      const h1 = playHalf(ms, 1, c.xi, ov, 'eq');
      const ev1 = halfEvents(ms, 1, h1, bestXI(opp));
      const pen1 = halfPenalty(ms, 1, ev1) ?? undefined;
      const end1 = 45 + addedTime(ms, 1);
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { k: 'half', gf1: h1.gf, ga1: h1.ga, sc1: h1.scorers, ev1, end1, pen1 } } } };
    }

    case 'HALF_PEN': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'half' || !c.sub.pen1 || c.sub.pen1.res) return state;
      const pen = c.sub.pen1;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      /* Índice 97: stream propio, no colisiona con los tiros de la tanda. */
      const res = pen.side === 'you'
        ? penKick(ms, 97, action.aim, avg(c.xi), ov)
        : oppPenShot(ms, 97, action.aim, avg(c.xi), ov);

      let { gf1, ga1 } = c.sub;
      let sc1 = c.sub.sc1;
      let ev1 = c.sub.ev1;
      const idx = ev1.findIndex((e) => e.min === pen.min && e.side === pen.side);
      if (res.scored) {
        ev1 = ev1.map((e, i) => (i === idx ? { ...e, p: true } : e));
      } else if (idx >= 0) {
        const gone = ev1[idx];
        ev1 = ev1.filter((_, i) => i !== idx);
        if (pen.side === 'you') {
          gf1 -= 1;
          const si = sc1.findIndex((sc) => sc.n === gone.n);
          if (si >= 0) sc1 = sc1.filter((_, i) => i !== si);
        } else {
          ga1 -= 1;
        }
      }
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { ...c.sub, gf1, ga1, sc1, ev1, pen1: { ...pen, res } } } } };
    }

    case 'DECIDE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'half') return state;
      const { gf1, ga1, sc1, ev1 } = c.sub;

      const stage: Stage = LADDER[c.stageIdx];
      const opp = teamById(c.oppId);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const h2 = playHalf(ms, 2, c.xi, ov, action.attitude);
      const ev2 = halfEvents(ms, 2, h2, bestXI(opp));
      const end2 = 90 + addedTime(ms, 2);
      const h2pack = { gf2: h2.gf, ga2: h2.ga, sc2: h2.scorers, ev2 };

      /* Penal en jugada del 2T: NO se liquida hasta resolverlo. */
      const pen2 = halfPenalty(ms, 2, ev2);
      if (pen2) {
        const sub: Sub = { k: 'h2pen', gf1, ga1, sc1, ev1, ...h2pack, end2, pen: pen2 };
        return { ...state, phase: { kind: 'campaign', c: { ...c, sub } } };
      }

      return { ...state, phase: { kind: 'campaign', c: settleH2(c, stage, opp.name, opp.edition, { gf1, ga1, sc1, ev1 }, h2pack, end2, ms) } };
    }

    case 'H2_PEN': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'h2pen' || c.sub.pen.res) return state;
      const pen = c.sub.pen;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;
      /* Índice 98: stream propio del penal del 2T. */
      const res = pen.side === 'you'
        ? penKick(ms, 98, action.aim, avg(c.xi), ov)
        : oppPenShot(ms, 98, action.aim, avg(c.xi), ov);

      let { gf2, ga2 } = c.sub;
      let sc2 = c.sub.sc2;
      let ev2 = c.sub.ev2;
      const idx = ev2.findIndex((e) => e.min === pen.min && e.side === pen.side);
      if (res.scored) {
        ev2 = ev2.map((e, i) => (i === idx ? { ...e, p: true } : e));
      } else if (idx >= 0) {
        const gone = ev2[idx];
        ev2 = ev2.filter((_, i) => i !== idx);
        if (pen.side === 'you') {
          gf2 -= 1;
          const si = sc2.findIndex((sc) => sc.n === gone.n);
          if (si >= 0) sc2 = sc2.filter((_, i) => i !== si);
        } else {
          ga2 -= 1;
        }
      }
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { ...c.sub, gf2, ga2, sc2, ev2, pen: { ...pen, res } } } } };
    }

    case 'H2_DONE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'h2pen' || !c.sub.pen.res) return state;
      const stage: Stage = LADDER[c.stageIdx];
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const { gf1, ga1, sc1, ev1, gf2, ga2, sc2, ev2, end2 } = c.sub;
      return { ...state, phase: { kind: 'campaign', c: settleH2(c, stage, opp.name, opp.edition, { gf1, ga1, sc1, ev1 }, { gf2, ga2, sc2, ev2 }, end2, ms, c.sub.pen.min) } };
    }

    case 'KICK': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'pens' || c.sub.winner) return state;
      if (pensTurn(c.sub.first, c.sub.you.length, c.sub.opp.length) !== 'you') return state;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;

      const you = [...c.sub.you, penKick(ms, c.sub.you.length, action.aim, avg(c.xi), ov)];
      const winner = shootoutWinner(you.map((k) => k.scored), c.sub.opp.map((k) => k.scored)) ?? undefined;
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { ...c.sub, you, winner } } } };
    }

    case 'DIVE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'pens' || c.sub.winner) return state;
      if (pensTurn(c.sub.first, c.sub.you.length, c.sub.opp.length) !== 'opp') return state;
      const opp = teamById(c.oppId);
      const ms = matchSeedFor(state.seed, c.stageIdx, c.leg);
      const ov = scaledRivalOf(opp, c.stageIdx).overall;

      const oppArr = [...c.sub.opp, oppPenShot(ms, c.sub.opp.length, action.aim, avg(c.xi), ov)];
      const winner = shootoutWinner(c.sub.you.map((k) => k.scored), oppArr.map((k) => k.scored)) ?? undefined;
      return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { ...c.sub, opp: oppArr, winner } } } };
    }

    case 'PENS_DONE': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'pens' || !c.sub.winner) return state;
      const stage: Stage = LADDER[c.stageIdx];
      const opp = teamById(c.oppId);
      const pens: Shootout = {
        you: c.sub.you.filter((k) => k.scored).length,
        opp: c.sub.opp.filter((k) => k.scored).length,
      };
      const outcome: 'W' | 'L' = c.sub.winner === 'you' ? 'W' : 'L';
      const m: MatchView = {
        oppId: c.oppId, oppName: opp.name, oppEdition: opp.edition,
        gf: c.sub.gf, ga: c.sub.ga, scorers: c.sub.scorers, ev: c.sub.ev, pens, outcome, end2: c.sub.end2,
        leg: isTwoLegged(stage) ? c.leg : undefined, agg: c.sub.agg,
      };
      return { ...state, phase: { kind: 'campaign', c: { ...c, ...settleMatch(c, stage, m) } } };
    }

    case 'NEXT': {
      if (state.phase.kind !== 'campaign') return state;
      const c = state.phase.c;
      if (c.sub.k !== 'fulltime' || c.done) return state;

      /* Serie abierta: la vuelta es contra el MISMO rival (leg ya quedó en 2
         al liquidar la ida). */
      if (isTwoLegged(LADDER[c.stageIdx]) && c.sub.m.leg === 1) {
        return { ...state, phase: { kind: 'campaign', c: { ...c, sub: { k: 'preview' } } } };
      }

      const nextIdx = c.stageIdx + 1;
      const ms = matchSeedFor(state.seed, nextIdx);
      const candidates = c.pool.filter((id) => id !== c.oppId);
      const oppId = pickOpponent(ms, candidates.length ? candidates : c.pool, TEAMS, nextIdx);
      return { ...state, phase: { kind: 'campaign', c: { ...c, stageIdx: nextIdx, oppId, leg: 1, agg1: undefined, sub: { k: 'preview' } } } };
    }

    case 'GO_HOME':
      /* Conserva semilla y formación: por determinismo, la misma semilla +
         las mismas decisiones reproducen la corrida si querés volver. */
      return { ...state, phase: { kind: 'setup' } };

    case 'RESET':
      return { seed: action.seed, formation: state.formation, phase: { kind: 'setup' }, mode: 'free', log: emptyRunInput() };
    default:
      return state;
  }
}

/* Captura: envuelve al reducer y anota la decisión del jugador cuando la
   acción tuvo efecto (next !== state descarta los no-op de las guardias).
   Los saltos forzados del draft no pasan por acá: se reproducen solos. */
function capture(state: GameState, action: Action): GameState {
  const next = reducer(state, action);
  if (next === state) return state;
  const push = (patch: Partial<RunInput>): GameState => ({ ...next, log: { ...next.log, ...patch } });
  switch (action.type) {
    case 'PICK': return push({ draft: [...next.log.draft, { pick: { player: action.player.i, slot: action.slot } }] });
    case 'PASS': return push({ draft: [...next.log.draft, { pass: true }] });
    case 'DECIDE': return push({ attitudes: [...next.log.attitudes, action.attitude] });
    case 'HALF_PEN':
    case 'H2_PEN': return push({ penAims: [...next.log.penAims, action.aim] });
    case 'KICK':
    case 'DIVE': return push({ shoot: [...next.log.shoot, action.aim] });
    default: return next;
  }
}

/* ── Corte entre pantallas ──
   Deslizamiento breve del contenido al cambiar de fase o de partido.
   (La banda diagonal se probó y se descartó: básica, no sumaba.) */
const screenV = {
  initial: { opacity: 0, x: 28 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -28, transition: { duration: 0.18, ease: 'easeIn' as const } },
};

export default function App() {
  const [state, dispatch] = useReducer(capture, undefined, init);
  const t = useT();
  const { locale } = useLocale();
  const rootStyle = { '--seed-hue': String(seedHue(state.seed)) } as CSSProperties;

  const phase = state.phase;

  const [dailyDone, setDailyDone] = useState<DailyRecord | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  /* Share-code de la corrida terminada: se genera al cerrarse (campeón o
     eliminado) desde la captura del reducer. Es el string v1.… copiable. */
  const shareCode = useMemo<string | null>(() => {
    if (phase.kind !== 'campaign') return null;
    const cc = phase.c;
    if (!cc.done || cc.sub.k !== 'fulltime') return null;
    try {
      return encodeRun({ v: RUN_VERSION, seed: state.seed, formation: state.formation, ...state.log });
    } catch {
      return null;
    }
  }, [phase, state.seed, state.formation, state.log]);

  /* Modo espectador: ?r=CODIGO reproduce una corrida ajena (client-side, sin
     tocar el Worker). Se lee una sola vez al montar. */
  const [spectator] = useState<{ result: RunResult | null; seed: number } | undefined>(() => {
    const code = new URLSearchParams(window.location.search).get('r');
    if (!code) return undefined;
    const log = decodeRun(code);
    if (!log) return { result: null, seed: 0 };
    const res = playRun(log);
    return { result: res.ok ? res : null, seed: log.seed };
  });
  const [showSpectator, setShowSpectator] = useState(true);
  const spectatorActive = spectator !== undefined && showSpectator;

  /* ── Corte de transmisión entre pantallas ──
     La clave cambia en los CORTES grandes (fase nueva o partido nuevo);
     los sub-estados dentro de un partido siguen instantáneos (cada
     componente ya trae su entrada). Presentación pura: no toca el core. */
  const screenKey =
    spectatorActive ? 'spec'
    : phase.kind === 'setup' ? (dailyDone ? 'daily-done' : 'setup')
    : phase.kind === 'drafting' ? 'draft'
    : `match-${phase.c.stageIdx}-${phase.c.leg}`;

  /* Al cortar a una pantalla nueva, arrancarla desde arriba. */
  const prevKeyRef = useRef(screenKey);
  useEffect(() => {
    if (prevKeyRef.current !== screenKey) {
      prevKeyRef.current = screenKey;
      window.scrollTo(0, 0);
    }
  }, [screenKey]);

  /* Candado del diario: al terminar la corrida (campeón o eliminado) se
     persiste el resultado. Sincronización con sistema externo → effect. */
  useEffect(() => {
    if (phase.kind !== 'campaign') return;
    const c = phase.c;
    const done = c.done;
    if (!done || c.sub.k !== 'fulltime') return;

    /* Test de oro (solo dev): reproducir la corrida capturada con playRun y
       confirmar que coincide con lo que mostró el reducer. Es el candado que
       valida la captura antes de construir el codec encima. */
    if (import.meta.env.DEV) {
      const log: RunLog = { v: RUN_VERSION, seed: state.seed, formation: state.formation, ...state.log };
      const r = playRun(log);
      const same =
        r.ok && r.champion === done.champion && r.stage === done.stage &&
        r.stats.w === c.stats.w && r.stats.d === c.stats.d && r.stats.l === c.stats.l &&
        r.stats.gf === c.stats.gf && r.stats.ga === c.stats.ga;
      if (same) console.info('[sharecode] gold test OK \u2713', log);
      else console.warn('[sharecode] gold test FAILED', { error: r.error, replay: r, reducer: { champion: done.champion, stage: done.stage, stats: c.stats } });
    }

    /* Candado del diario (solo daily): al terminar la corrida se persiste.
       Sincronización con sistema externo → effect. */
    if (state.mode !== 'daily') return;
    if (loadDaily()) return; // ya guardado
    const m = c.sub.m;
    saveDaily({
      champion: done.champion,
      gf: m.gf, ga: m.ga, opp: `${m.oppName} · ${m.oppEdition}`, stage: done.stage,
      stats: { w: c.stats.w, d: c.stats.d, l: c.stats.l, gf: c.stats.gf, ga: c.stats.ga, avg: Math.round(avg(c.xi)) },
    });
    bumpStreak(done.champion); // racha de días + vitrina de títulos
  }, [phase, state.mode, state.seed, state.formation, state.log]);

  const goHome = () => {
    if (phase.kind === 'setup') return;
    if (window.confirm(t('nav.leave'))) dispatch({ type: 'GO_HOME' });
  };

  const playNow = () => {
    if (phase.kind !== 'setup' && !window.confirm(t('nav.leave'))) return;
    dispatch({ type: 'START' });
  };

  const clearSpectatorUrl = () => window.history.replaceState({}, '', window.location.pathname);
  const closeSpectator = () => { setShowSpectator(false); clearSpectatorUrl(); };
  const playSpectatorSeed = (seed: number) => {
    setShowSpectator(false); clearSpectatorUrl();
    dispatch({ type: 'NEW_SEED', seed });
    dispatch({ type: 'START' });
  };

  return (
    <div className="app" style={rootStyle}>
      <div className="backdrop" aria-hidden="true">
        <span className="backdrop-glow" />
      </div>

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screenKey}
            className="screen"
            variants={screenV}
            initial="initial"
            animate="enter"
            exit="exit"
          >
        {spectatorActive ? (
          <Spectator
            result={spectator!.result}
            seed={spectator!.seed}
            onPlaySeed={playSpectatorSeed}
            onClose={closeSpectator}
          />
        ) : (<>
        {phase.kind === 'setup' && dailyDone && (
          <DailyDone
            rec={dailyDone}
            onFree={() => {
              /* "Jugar torneo libre" arranca el torneo, no te deja en el home. */
              setDailyDone(null);
              dispatch({ type: 'START' });
            }}
          />
        )}
        {phase.kind === 'setup' && !dailyDone && (
        <SetupStep
          formation={state.formation}
          seed={state.seed}
          onFormation={(formation) => dispatch({ type: 'SET_FORMATION', formation })}
          onNewSeed={() => dispatch({ type: 'NEW_SEED', seed: newSeed() })}
          onSetSeed={(seed) => dispatch({ type: 'NEW_SEED', seed })}
          onStart={() => dispatch({ type: 'START' })}
          onPlaySeed={(seed) => {
            dispatch({ type: 'NEW_SEED', seed });
            dispatch({ type: 'START' });
          }}
          onDaily={() => {
            /* Un intento por día: si ya jugaste, vas directo a tu resultado. */
            const rec = loadDaily();
            if (rec) setDailyDone(rec);
            else dispatch({ type: 'START_DAILY', seed: dailyRunSeed() });
          }}
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
          end1={phase.c.sub.end1}
          pen1={phase.c.sub.pen1}
          oppName={teamById(phase.c.oppId).name}
          tickerSecs={tickerSecsFor(LADDER[phase.c.stageIdx])}
          onDecide={(attitude) => dispatch({ type: 'DECIDE', attitude })}
          onPen={(aim) => dispatch({ type: 'HALF_PEN', aim })}
        />
      )}

      {phase.kind === 'campaign' && phase.c.sub.k === 'h2pen' && (
        <SecondHalfPen
          stageLabel={t('stage.' + LADDER[phase.c.stageIdx])}
          oppName={teamById(phase.c.oppId).name}
          ev1={phase.c.sub.ev1}
          ev2={phase.c.sub.ev2}
          end2={phase.c.sub.end2}
          pen={phase.c.sub.pen}
          tickerSecs={tickerSecsFor(LADDER[phase.c.stageIdx])}
          onPen={(aim) => dispatch({ type: 'H2_PEN', aim })}
          onSettle={() => dispatch({ type: 'H2_DONE' })}
        />
      )}
      {phase.kind === 'campaign' && phase.c.sub.k === 'pens' && (
        <PenaltyShootout
          key={`${phase.c.stageIdx}:${phase.c.leg}`}
          stageLabel={t('stage.' + LADDER[phase.c.stageIdx])}
          oppName={teamById(phase.c.oppId).name}
          gf={phase.c.sub.gf}
          ga={phase.c.sub.ga}
          ev={phase.c.sub.ev}
          end2={phase.c.sub.end2}
          resume={phase.c.sub.resume}
          agg={phase.c.sub.agg}
          first={phase.c.sub.first}
          you={phase.c.sub.you}
          opp={phase.c.sub.opp}
          winner={phase.c.sub.winner}
          tickerSecs={tickerSecsFor(LADDER[phase.c.stageIdx])}
          onKick={(aim) => dispatch({ type: 'KICK', aim })}
          onDive={(aim) => dispatch({ type: 'DIVE', aim })}
          onDone={() => dispatch({ type: 'PENS_DONE' })}
        />
      )}

      {phase.kind === 'campaign' && (phase.c.sub.k === 'preview' || phase.c.sub.k === 'fulltime') && (
        <TournamentStep
          campaign={phase.c}
          stageLabel={t('stage.' + LADDER[phase.c.stageIdx])}
          xiAvg={Math.round(avg(phase.c.xi))}
          opp={teamById(phase.c.oppId)}
          seed={state.seed}
          mode={state.mode}
          shareCode={shareCode}
          onKickoff={() => dispatch({ type: 'KICKOFF' })}
          onNext={() => dispatch({ type: 'NEXT' })}
          onRetry={() => {
            /* Revancha: misma semilla, directo al draft (cero fricción). */
            dispatch({ type: 'RESET', seed: state.seed });
            dispatch({ type: 'START' });
          }}
          onReset={() => dispatch({ type: 'RESET', seed: newSeed() })}
        />
      )}
        </>)}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <button className="footer-brand" onClick={goHome}>Mística Futbolera</button>
        <button className="footer-tag" onClick={playNow}>{t('footer.tag')}</button>
        <nav className="footer-links">
          <button className="footer-link" onClick={() => setShowFeedback(true)}>{t('fb.link')}</button>
          <a href={locale === 'es' ? '/privacidad.html' : '/privacidad.html#en'}>{t('footer.privacy')}</a>
        </nav>
      </footer>
      {showFeedback && <Feedback onClose={() => setShowFeedback(false)} />}
    </div>
  );
}