/* ══════════════════════════════════════════
   i18n.ts — internacionalización (sin JSX)
   'es' (rioplatense) y 'en' (registro futbolero británico, NO traducción
   literal) completos. 'pt'/'fr' caen a 'es' hasta traducirlos.
   El nombre de marca "Mística Futbolera" NO se traduce.
   El componente <LocaleProvider> vive en components/LocaleProvider.tsx
   (react-refresh exige que los archivos con componentes solo exporten eso).
══════════════════════════════════════════ */
import { createContext, useContext } from 'react';

export type Locale = 'es' | 'en' | 'pt' | 'fr';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
  { code: 'fr', label: 'FR' },
];

type Dict = Record<string, string>;

const STRINGS: Record<Locale, Dict> = {
  es: {
    'tagline': 'Convertite en el rey de Europa.',
    'home.eyebrow': '23 equipos míticos · 1993 — 2025',
    'home.h1': 'Drafteá leyendas.',
    'home.sub': 'La semilla sortea glorias de Europa: campeones y finalistas míticos. De cada uno elegís un crack, llenás tu once y vas por la copa: grupo, eliminatorias y la gran final.',
    'home.showcase': 'Un once posible. El tuyo lo armás vos.',
    'home.seedHint': 'Misma semilla, mismo torneo. Compartila y desafiá.',
    'home.copy': 'Copiar', 'home.copied': '¡Copiada!',
    'nav.leave': '¿Volver al inicio? Se pierde la partida en curso.',
    'footer.tag': 'Drafteá · Competí · Desafiá',
    'footer.privacy': 'Privacidad',
    'ticker.first': 'Primer tiempo', 'ticker.second': 'Segundo tiempo',
    'ticker.ht': 'Entretiempo', 'ticker.ft': 'Final del partido',
    'ticker.goalOpp': 'Gol de {opp}', 'ticker.skip': 'tocá para saltar',
    'pens.title': 'Penales', 'pens.aim': '¿Dónde pateás?',
    'pens.left': 'Izquierda', 'pens.center': 'Centro', 'pens.right': 'Derecha',
    'pens.goal': '¡GOL!', 'pens.saved': '¡Atajado!', 'pens.out': '¡Afuera!',
    'pens.oppGoal': 'Gol de {opp}.', 'pens.oppMiss': '¡{opp} lo erró!',
    'pens.you': 'Vos', 'pens.opp': 'Rival',
    'pens.win': '¡Tanda ganada!', 'pens.lose': 'Tanda perdida.',
    'pens.toss': 'Sorteo de la tanda',
    'pens.first.you': 'Arrancás pateando', 'pens.first.opp': 'Arranca pateando el rival',
    'pens.turn.you': 'Pateás vos', 'pens.turn.opp': 'Atajás vos',
    'pens.dive': '¿Dónde se tira tu arquero?',
    'pens.youSaved': '¡LO ATAJASTE!', 'pens.oppOut': '¡La tiró afuera!',
    'pens.see': 'Ver resultado',
    'common.attack': 'Ataque', 'common.defense': 'Defensa', 'common.avg': 'Media', 'common.cancel': 'Cancelar',
    'setup.formation': 'Formación', 'setup.seed': 'Semilla', 'setup.new': 'Nueva', 'setup.start': 'Empezar draft',
    'setup.stats': '23 equipos · 6 formaciones · determinista por semilla',
    'howto.1.t': 'Drafteá', 'howto.1.d': 'Cruzá glorias de Europa y armá tu once.',
    'howto.2.t': 'Competí', 'howto.2.d': 'Grupo, eliminatorias y la gran final.',
    'howto.3.t': 'Desafiá', 'howto.3.d': 'Misma semilla, mismo torneo. Compartilo.',
    'draft.of': 'de 11', 'draft.spinning': 'Sorteando campeón…',
    'draft.choose': '¿Dónde va {n}? Tocá un puesto.',
    'draft.none': 'No te sirve nadie de este campeón.', 'draft.reroll': 'Sortear otro (gratis)',
    'draft.passes': 'Descartes', 'draft.pass': 'Pasar campeón', 'draft.simulate': 'Arrancar el torneo',
    'match.halftime': 'Entretiempo', 'match.attackRival': 'Ataque rival', 'match.defenseRival': 'Defensa rival',
    'match.lead.win': 'Vas ganando. ¿Lo liquidás o lo cuidás?',
    'match.lead.draw': 'Todo igualado. Vos definís el partido.',
    'match.lead.lose': 'Vas perdiendo. Hay que salir a buscarlo.',
    'att.def.t': 'Defensivo', 'att.def.d': 'Aguantás el resultado. Concedés menos, pero casi no atacás.',
    'att.eq.t': 'Equilibrado', 'att.eq.d': 'Sin cambios. Dejás que el partido fluya.',
    'att.off.t': 'Ofensivo', 'att.off.d': 'Vas por todo. Más chances de gol, pero te exponés atrás.',
    'match.next': 'Próximo rival', 'match.play': 'Jugar partido', 'match.yourAvg': 'Tu media',
    'match.groupPts': '· Puntos: {p} (necesitás 3 para avanzar)',
    'card.again': 'Torneo nuevo', 'card.nextRound': 'Siguiente ronda',
    'card.retry': 'Revancha · misma semilla',
    'card.challenge': 'Pasale la semilla a un amigo: mismo torneo, mismas cartas.',
    'card.share': 'Compartir',
    'card.shareText': '🏆 Te desafío en Mística Futbolera. Semilla: {seed} — mismo torneo, mismas cartas. ¿Me ganás?',
    'vs.you': 'Tu once',
    'card.yourGoals': 'Tus goles', 'card.campaign': 'Tu campaña',
    'card.vs': 'Tu once vs {opp}', 'card.pens': 'Penales {a}–{b}',
    'result.W': 'Victoria', 'result.D': 'Empate', 'result.L': 'Derrota',
    'rec.w': 'G', 'rec.d': 'E', 'rec.l': 'P',
    'stats.played': 'Partidos', 'stats.goals': 'Goles: {gf} a favor, {ga} en contra',
    'stats.cs': 'Vallas invictas', 'stats.topScorer': 'Goleador',
    'stats.record': 'PJ {pj} · {w}G {d}E {l}P · GF {gf} GA {ga}',
    'advance.r16': 'A Cuartos.', 'advance.qf': 'A Semifinal.', 'advance.sf': '¡A la FINAL!',
    'stage.g1': 'Grupo · Fecha 1', 'stage.g2': 'Grupo · Fecha 2', 'stage.r16': 'Octavos',
    'stage.qf': 'Cuartos', 'stage.sf': 'Semifinal', 'stage.final': 'Final',
  },
  en: {
    /* Registro futbolero británico: localización, no traducción palabra a palabra. */
    'tagline': 'Become the king of Europe.',
    'home.eyebrow': '23 legendary sides · 1993 — 2025',
    'home.h1': 'Draft legends.',
    'home.sub': 'Every seed deals a run of European greats — champions and iconic finalists. Take one star from each, complete your XI and go win it all: group stage, knockouts, the final.',
    'home.showcase': 'One possible XI. Yours is up to you.',
    'home.seedHint': 'Same seed, same run. Share it and challenge a mate.',
    'home.copy': 'Copy', 'home.copied': 'Copied!',
    'nav.leave': 'Head back home? Your current run will be lost.',
    'footer.tag': 'Draft · Compete · Challenge',
    'footer.privacy': 'Privacy',
    'ticker.first': 'First half', 'ticker.second': 'Second half',
    'ticker.ht': 'Half-time', 'ticker.ft': 'Full time',
    'ticker.goalOpp': '{opp} score', 'ticker.skip': 'tap to skip',
    'pens.title': 'Penalties', 'pens.aim': 'Pick your corner',
    'pens.left': 'Left', 'pens.center': 'Middle', 'pens.right': 'Right',
    'pens.goal': 'GOAL!', 'pens.saved': 'SAVED!', 'pens.out': 'WIDE!',
    'pens.oppGoal': '{opp} score.', 'pens.oppMiss': '{opp} miss!',
    'pens.you': 'You', 'pens.opp': 'Them',
    'pens.win': 'Shootout won!', 'pens.lose': 'Shootout lost.',
    'pens.toss': 'Shootout draw',
    'pens.first.you': 'You kick first', 'pens.first.opp': 'They kick first',
    'pens.turn.you': 'Your kick', 'pens.turn.opp': 'You’re in goal',
    'pens.dive': 'Where does your keeper dive?',
    'pens.youSaved': 'SAVED IT!', 'pens.oppOut': 'Blazed wide!',
    'pens.see': 'See result',
    'common.attack': 'Attack', 'common.defense': 'Defence', 'common.avg': 'Rating', 'common.cancel': 'Cancel',
    'setup.formation': 'Formation', 'setup.seed': 'Seed', 'setup.new': 'New', 'setup.start': 'Start your draft',
    'setup.stats': '23 sides · 6 formations · same seed, same tournament',
    'howto.1.t': 'Draft', 'howto.1.d': 'Mix Europe’s legends into one XI.',
    'howto.2.t': 'Compete', 'howto.2.d': 'Group stage, knockouts, the final.',
    'howto.3.t': 'Challenge', 'howto.3.d': 'Same seed, same run. Share it.',
    'draft.of': 'of 11', 'draft.spinning': 'Drawing a champion…',
    'draft.choose': 'Where does {n} fit? Tap a slot.',
    'draft.none': 'Nobody here fits your XI.', 'draft.reroll': 'Spin again (free)',
    'draft.passes': 'Skips', 'draft.pass': 'Skip this team', 'draft.simulate': 'Kick off the campaign',
    'match.halftime': 'Half-time', 'match.attackRival': 'Their attack', 'match.defenseRival': 'Their defence',
    'match.lead.win': 'You’re ahead. Kill the game or protect the lead?',
    'match.lead.draw': 'All square. The next call decides it.',
    'match.lead.lose': 'You’re behind. Time to chase the game.',
    'att.def.t': 'Defensive', 'att.def.d': 'Park the bus. Concede less, create little.',
    'att.eq.t': 'Balanced', 'att.eq.d': 'No changes. Let it flow.',
    'att.off.t': 'Attacking', 'att.off.d': 'Throw everything forward. More chances, exposed at the back.',
    'match.next': 'Up next', 'match.play': 'Kick off', 'match.yourAvg': 'Your rating',
    'match.groupPts': '· Points: {p} (3 to go through)',
    'card.again': 'New run', 'card.nextRound': 'Next round',
    'card.retry': 'Rematch · same seed',
    'card.challenge': 'Send the seed to a mate: same run, same cards.',
    'card.share': 'Share',
    'card.shareText': '🏆 I challenge you on Mística Futbolera. Seed: {seed} — same run, same cards. Can you beat me?',
    'vs.you': 'Your XI',
    'card.yourGoals': 'Your goals', 'card.campaign': 'Your campaign',
    'card.vs': 'Your XI vs {opp}', 'card.pens': 'Penalties {a}–{b}',
    'result.W': 'Win', 'result.D': 'Draw', 'result.L': 'Defeat',
    'rec.w': 'W', 'rec.d': 'D', 'rec.l': 'L',
    'stats.played': 'Played', 'stats.goals': 'Goals: {gf} scored, {ga} conceded',
    'stats.cs': 'Clean sheets', 'stats.topScorer': 'Top scorer',
    'stats.record': 'P {pj} · {w}W {d}D {l}L · GF {gf} GA {ga}',
    'advance.r16': 'On to the quarters.', 'advance.qf': 'On to the semis.', 'advance.sf': 'Through to the FINAL!',
    'stage.g1': 'Group · Matchday 1', 'stage.g2': 'Group · Matchday 2', 'stage.r16': 'Round of 16',
    'stage.qf': 'Quarter-final', 'stage.sf': 'Semi-final', 'stage.final': 'Final',
  },
  pt: {},
  fr: {},
};

export function tr(locale: Locale, key: string): string {
  return STRINGS[locale][key] ?? STRINGS.es[key] ?? key;
}

export interface LocaleCtx { locale: Locale; setLocale: (l: Locale) => void; }

export const LocaleContext = createContext<LocaleCtx>({ locale: 'es', setLocale: () => {} });

export const useLocale = () => useContext(LocaleContext);

export type T = (key: string, vars?: Record<string, string | number>) => string;

export function useT(): T {
  const { locale } = useLocale();
  return (key, vars) => {
    let s = tr(locale, key);
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  };
}