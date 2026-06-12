import { useCallback, useState, type ReactNode } from 'react';
import { LocaleContext, type Locale } from '../i18n';

const LS_KEY = 'mf:locale';
const VALID = new Set<string>(['es', 'en', 'pt', 'fr']);

/* Idioma inicial: 1) el que el usuario ELIGIÓ antes (localStorage),
   2) el del navegador, 3) español. La elección manual le gana siempre a la
   detección. try/catch: en incógnito localStorage puede fallar. */
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && VALID.has(saved)) return saved as Locale;
  } catch { /* incógnito */ }
  try {
    const lang = (navigator.language || 'es').slice(0, 2).toLowerCase();
    if (VALID.has(lang) && lang !== 'es') return lang as Locale;
  } catch { /* SSR/edge */ }
  return 'es';
}

/* Único export = componente → Fast Refresh contento (react-refresh/only-export-components). */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(LS_KEY, l); } catch { /* incógnito */ }
  }, []);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}