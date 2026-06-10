import { useState, type ReactNode } from 'react';
import { LocaleContext, type Locale } from '../i18n';

/* Único export = componente → Fast Refresh contento (react-refresh/only-export-components). */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}