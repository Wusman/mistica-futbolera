/* ══════════════════════════════════════════
   i18n.tsx — internacionalización
   'es' y 'en' completos. 'pt'/'fr' caen a 'es' hasta traducirlos.
   El nombre de marca "Mística Futbolera" NO se traduce.
══════════════════════════════════════════ */
import { createContext, useContext, useState, type ReactNode } from 'react';

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
    'home.eyebrow': '14 campeones de Europa · 1993 — 2023',
    'home.h1': 'Drafteá leyendas.',
    'home.sub': 'La semilla sortea campeones históricos. De cada uno elegís un crack, llenás tu once y vas por la copa: grupo, eliminatorias y la gran final.',
    'home.showcase': 'Un once posible. El tuyo lo armás vos.',
    'home.seedHint': 'Misma semilla, mismo torneo. Compartila y desafiá.',
    'home.copy': 'Copiar', 'home.copied': '¡Copiada!',
    'nav.leave': '¿Volver al inicio? Se pierde la partida en curso.',
    'footer.tag': 'Drafteá · Competí · Desafiá',
    'footer.privacy': 'Privacidad',
    'ticker.first': 'Primer tiempo', 'ticker.second': 'Segundo tiempo',
    'ticker.ht': 'Entretiempo', 'ticker.ft': 'Final del partido',
    'ticker.goalOpp': 'Gol de {opp}', 'ticker.skip': 'tocá para saltar',
    'common.attack': 'Ataque', 'common.defense': 'Defensa', 'common.avg': 'Media', 'common.cancel': 'Cancelar',
    'setup.formation': 'Formación', 'setup.seed': 'Semilla', 'setup.new': 'Nueva', 'setup.start': 'Empezar draft',
    'setup.stats': '14 campeones · 6 formaciones · determinista por semilla',
    'howto.1.t': 'Drafteá', 'howto.1.d': 'Cruzá glorias de Europa y armá tu once.',
    'howto.2.t': 'Competí', 'howto.2.d': 'Grupo, eliminatorias y la gran final.',
    'howto.3.t': 'Desafiá', 'howto.3.d': 'Misma semilla, mismo torneo. Compartilo.',
    'draft.of': 'de 11', 'draft.spinning': 'Sorteando campeón…',
    'draft.choose': '¿Dónde va {n}? Tocá un puesto.',
    'draft.none': 'No te sirve nadie de este campeón.', 'draft.reroll': 'Sortear otro (gratis)',
    'draft.passes': 'Descartes', 'draft.pass': 'Pasar campeón', 'draft.simulate': 'Simular partido',
    'match.halftime': 'Entretiempo', 'match.attackRival': 'Ataque rival', 'match.defenseRival': 'Defensa rival',
    'match.lead.win': 'Vas ganando. ¿Lo liquidás o lo cuidás?',
    'match.lead.draw': 'Todo igualado. Vos definís el partido.',
    'match.lead.lose': 'Vas perdiendo. Hay que salir a buscarlo.',
    'att.def.t': 'Defensivo', 'att.def.d': 'Aguantás el resultado. Concedés menos, pero casi no atacás.',
    'att.eq.t': 'Equilibrado', 'att.eq.d': 'Sin cambios. Dejás que el partido fluya.',
    'att.off.t': 'Ofensivo', 'att.off.d': 'Vas por todo. Más chances de gol, pero te exponés atrás.',
    'match.next': 'Próximo rival', 'match.play': 'Jugar partido', 'match.yourAvg': 'Tu media',
    'match.groupPts': '· Puntos: {p} (necesitás 3 para avanzar)',
    'card.again': 'Jugar de nuevo', 'card.nextRound': 'Siguiente ronda',
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
    'tagline': 'Become the king of Europe.',
    'home.eyebrow': '14 European champions · 1993 — 2023',
    'home.h1': 'Draft legends.',
    'home.sub': 'The seed draws historic champions. Pick a star from each, fill your XI and go win the cup: group stage, knockouts and the grand final.',
    'home.showcase': 'One possible XI. Yours is up to you.',
    'home.seedHint': 'Same seed, same run. Share it and challenge.',
    'home.copy': 'Copy', 'home.copied': 'Copied!',
    'nav.leave': 'Back to home? Your current run will be lost.',
    'footer.tag': 'Draft · Compete · Challenge',
    'footer.privacy': 'Privacy',
    'ticker.first': 'First half', 'ticker.second': 'Second half',
    'ticker.ht': 'Half-time', 'ticker.ft': 'Full time',
    'ticker.goalOpp': '{opp} score', 'ticker.skip': 'tap to skip',
    'common.attack': 'Attack', 'common.defense': 'Defense', 'common.avg': 'Avg', 'common.cancel': 'Cancel',
    'setup.formation': 'Formation', 'setup.seed': 'Seed', 'setup.new': 'New', 'setup.start': 'Start draft',
    'setup.stats': '14 champions · 6 formations · seed-deterministic',
    'howto.1.t': 'Draft', 'howto.1.d': 'Mix Europe’s legends and build your XI.',
    'howto.2.t': 'Compete', 'howto.2.d': 'Group stage, knockouts and the grand final.',
    'howto.3.t': 'Challenge', 'howto.3.d': 'Same seed, same run. Share it.',
    'draft.of': 'of 11', 'draft.spinning': 'Drawing champion…',
    'draft.choose': 'Where does {n} go? Tap a slot.',
    'draft.none': 'No one here fits your XI.', 'draft.reroll': 'Draw another (free)',
    'draft.passes': 'Skips', 'draft.pass': 'Skip champion', 'draft.simulate': 'Simulate match',
    'match.halftime': 'Half-time', 'match.attackRival': 'Opp. attack', 'match.defenseRival': 'Opp. defense',
    'match.lead.win': 'You’re ahead. Kill it or protect it?',
    'match.lead.draw': 'All level. You decide the match.',
    'match.lead.lose': 'You’re behind. Time to chase it.',
    'att.def.t': 'Defensive', 'att.def.d': 'Hold the result. Concede less, but barely attack.',
    'att.eq.t': 'Balanced', 'att.eq.d': 'No changes. Let the game flow.',
    'att.off.t': 'Attacking', 'att.off.d': 'Go for it. More chances, but exposed at the back.',
    'match.next': 'Next rival', 'match.play': 'Play match', 'match.yourAvg': 'Your avg',
    'match.groupPts': '· Points: {p} (need 3 to advance)',
    'card.again': 'Play again', 'card.nextRound': 'Next round',
    'card.yourGoals': 'Your goals', 'card.campaign': 'Your run',
    'card.vs': 'Your XI vs {opp}', 'card.pens': 'Penalties {a}–{b}',
    'result.W': 'Win', 'result.D': 'Draw', 'result.L': 'Loss',
    'rec.w': 'W', 'rec.d': 'D', 'rec.l': 'L',
    'stats.played': 'Played', 'stats.goals': 'Goals: {gf} for, {ga} against',
    'stats.cs': 'Clean sheets', 'stats.topScorer': 'Top scorer',
    'stats.record': 'P {pj} · {w}W {d}D {l}L · GF {gf} GA {ga}',
    'advance.r16': 'To the Quarters.', 'advance.qf': 'To the Semis.', 'advance.sf': 'To the FINAL!',
    'stage.g1': 'Group · Matchday 1', 'stage.g2': 'Group · Matchday 2', 'stage.r16': 'Round of 16',
    'stage.qf': 'Quarter-final', 'stage.sf': 'Semi-final', 'stage.final': 'Final',
  },
  pt: {},
  fr: {},
};

export function tr(locale: Locale, key: string): string {
  return STRINGS[locale][key] ?? STRINGS.es[key] ?? key;
}

interface LocaleCtx { locale: Locale; setLocale: (l: Locale) => void; }
const Ctx = createContext<LocaleCtx>({ locale: 'es', setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);

export type T = (key: string, vars?: Record<string, string | number>) => string;

export function useT(): T {
  const { locale } = useLocale();
  return (key, vars) => {
    let s = tr(locale, key);
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  };
}