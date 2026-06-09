import { type CSSProperties } from 'react';
import { LOCALES, useLocale, type Locale } from '../i18n';

/* Idiomas listos hoy. Sumá 'pt'/'fr' acá cuando estén traducidos. */
const READY: Locale[] = ['es', 'en'];

const box: CSSProperties = { display: 'flex', gap: 4 };
const btn = (on: boolean): CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  letterSpacing: 1,
  padding: '4px 8px',
  cursor: 'pointer',
  color: on ? '#fff' : 'var(--muted)',
  background: on ? 'var(--accent)' : 'transparent',
  border: '1px solid var(--line)',
  borderRadius: 6,
});

export function LangSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <div style={box}>
      {LOCALES.filter((l) => READY.includes(l.code)).map((l) => (
        <button key={l.code} style={btn(l.code === locale)} onClick={() => setLocale(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}