import { type CSSProperties, useState } from 'react';
import { Emblem } from './Emblem';
import { ESCUDO_PALETTE, loadEscudo, saveEscudo } from '../lib/escudo';
import { YOU_EMBLEM } from '../config';
import { useT } from '../i18n';

/* Creador de escudo dentro del draft: tap 1–3 colores de la paleta curada y el
   emblema de "tu once" se arma en vivo. Persiste solo (localStorage); no toca
   estado de juego ni semilla. */
export function EscudoCreator() {
  const t = useT();
  const [colors, setColors] = useState<string[]>(() => loadEscudo() ?? []);

  const toggle = (c: string) => {
    setColors((prev) => {
      let next: string[];
      if (prev.includes(c)) next = prev.filter((x) => x !== c);
      else if (prev.length >= 3) next = prev; // máx 3
      else next = [...prev, c];
      saveEscudo(next);
      return next;
    });
  };

  const preview = colors.length ? colors : YOU_EMBLEM;

  return (
    <div className="escudo">
      <div className="escudo-head">
        <Emblem colors={preview} size={42} />
        <div className="escudo-txt">
          <span className="escudo-title">{t('escudo.title')}</span>
          <span className="escudo-hint">{t('escudo.hint')}</span>
        </div>
      </div>
      <div className="escudo-swatches">
        {ESCUDO_PALETTE.map((c) => {
          const i = colors.indexOf(c);
          return (
            <button
              key={c}
              type="button"
              className={`swatch ${i >= 0 ? 'swatch--on' : ''}`}
              style={{ '--sw': c } as CSSProperties}
              onClick={() => toggle(c)}
              aria-pressed={i >= 0}
              aria-label={c}
            >
              {i >= 0 && <span className="swatch-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}