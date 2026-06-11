import { useState, type ReactNode } from 'react';
import { LocaleContext, type Locale } from '../i18n';

/* Idioma inicial = el del navegador (es/en/pt/fr; default es). pt/fr todavía
   caen a es hasta tener diccionario, pero la detección ya queda lista. */
function detectLocale(): Locale {
  try {
    const lang = (navigator.language || 'es').slice(0, 2).toLowerCase();
    if (lang === 'en' || lang === 'pt' || lang === 'fr') return lang;
  } catch { /* SSR/edge: default */ }
  return 'es';
}

/* Único export = componente → Fast Refresh contento (react-refresh/only-export-components). */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}