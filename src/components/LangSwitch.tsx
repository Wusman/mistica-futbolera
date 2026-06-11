import { useEffect, useRef, useState } from 'react';
import { LOCALES, useLocale } from '../i18n';

/* Selector de idioma: botón con el código actual que abre un menú hacia
   abajo con los 4 idiomas. Accesible: Escape y click afuera cierran,
   aria-expanded en el botón, aria-current en el activo. */
export function LangSwitch() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lang" ref={ref}>
      <button
        className="lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {locale.toUpperCase()} <span className="lang-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                className={`lang-opt ${l.code === locale ? 'lang-opt--on' : ''}`}
                role="option"
                aria-selected={l.code === locale}
                onClick={() => { setLocale(l.code); setOpen(false); }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}