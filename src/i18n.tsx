/* ══════════════════════════════════════════
   i18n.tsx — base de internacionalización
   Foco: público europeo (es-ES informal / en / pt / fr).

   Cómo se usa (cuando lo enchufemos en la próxima pasada):
     1. Envolver <App/> en <LocaleProvider> (en main.tsx).
     2. En cualquier componente:  const t = useT();  →  t('setup.start')
     3. Para cambiar idioma:       const { locale, setLocale } = useLocale();

   Reglas:
   - 'es' es la base/fallback: si una clave falta en otro idioma, cae a 'es'.
   - El nombre de marca "Mística Futbolera" NO se traduce.
   - Las frases dinámicas del partido ya viven en messages.ts (mismo patrón);
     ese módulo también recibirá `locale` cuando migremos.
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

/* Claves de UI estática. Se van sumando a medida que migramos pantallas.
   'es' completo = la fuente de verdad; el resto puede estar parcial. */
const STRINGS: Record<Locale, Dict> = {
  es: {
    'tagline': 'Convertite en el rey de Europa.',
    'setup.formation': 'Formación',
    'setup.seed': 'Semilla',
    'setup.new': 'Nueva',
    'setup.start': 'Empezar draft',
    'setup.stats': '14 campeones · 6 formaciones · determinista por semilla',
    'howto.1.t': 'Drafteá',
    'howto.1.d': 'Cruzá glorias de Europa y armá tu once.',
    'howto.2.t': 'Competí',
    'howto.2.d': 'Grupo, eliminatorias y la gran final.',
    'howto.3.t': 'Desafiá',
    'howto.3.d': 'Misma semilla, mismo torneo. Compartilo.',
    'draft.of': 'de 11',
    'draft.avg': 'Media',
    'draft.spinning': 'Sorteando campeón…',
    'draft.passes': 'Descartes',
    'draft.pass': 'Pasar campeón',
    'draft.none': 'No te sirve nadie de este campeón.',
    'draft.reroll': 'Sortear otro (gratis)',
    'draft.simulate': 'Simular partido',
    'match.rivalSpinning': 'Sorteando rival…',
    'match.next': 'Próximo rival',
    'match.play': 'Jugar partido',
    'match.yourAvg': 'Tu media',
    'card.again': 'Jugar de nuevo',
    'card.nextRound': 'Siguiente ronda',
    'card.yourGoals': 'Tus goles',
    'card.campaign': 'Tu campaña',
  },
  en: {
    'tagline': 'Become the king of Europe.',
    'setup.formation': 'Formation',
    'setup.seed': 'Seed',
    'setup.new': 'New',
    'setup.start': 'Start draft',
    'setup.stats': '14 champions · 6 formations · seed-deterministic',
    'howto.1.t': 'Draft',
    'howto.1.d': 'Mix Europe’s legends and build your XI.',
    'howto.2.t': 'Compete',
    'howto.2.d': 'Group stage, knockouts and the grand final.',
    'howto.3.t': 'Challenge',
    'howto.3.d': 'Same seed, same run. Share it.',
    'draft.of': 'of 11',
    'draft.avg': 'Avg',
    'draft.spinning': 'Drawing champion…',
    'draft.passes': 'Skips',
    'draft.pass': 'Skip champion',
    'draft.none': 'No one here fits your XI.',
    'draft.reroll': 'Draw another (free)',
    'draft.simulate': 'Simulate match',
    'match.rivalSpinning': 'Drawing rival…',
    'match.next': 'Next rival',
    'match.play': 'Play match',
    'match.yourAvg': 'Your avg',
    'card.again': 'Play again',
    'card.nextRound': 'Next round',
    'card.yourGoals': 'Your goals',
    'card.campaign': 'Your run',
  },
  pt: {}, // fallback a 'es' por ahora
  fr: {}, // fallback a 'es' por ahora
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
export function useT() {
  const { locale } = useLocale();
  return (key: string) => tr(locale, key);
}