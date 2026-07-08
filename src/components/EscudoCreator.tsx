import { type CSSProperties, useState } from 'react';
import { Emblem } from './Emblem';
import {
  ESCUDO_PALETTE, PATTERNS, type Pattern,
  loadEscudo, saveEscudo, loadTeamName, saveTeamName, loadPattern, savePattern,
} from '../lib/escudo';
import { YOU_EMBLEM } from '../config';
import { useT } from '../i18n';

/* Panel de identidad dentro del draft: nombre + escudo (1–3 colores de la paleta
   curada + patrón). El emblema se arma en vivo. Persiste solo (localStorage);
   no toca estado de juego ni semilla. */
export function EscudoCreator() {
  const t = useT();
  const [colors, setColors] = useState<string[]>(() => loadEscudo() ?? []);
  const [name, setName] = useState<string>(() => loadTeamName());
  const [pattern, setPattern] = useState<Pattern>(() => loadPattern());

  const toggle = (col: string) => {
    setColors((prev) => {
      let next: string[];
      if (prev.includes(col)) next = prev.filter((x) => x !== col);
      else if (prev.length >= 3) next = prev; // máx 3
      else next = [...prev, col];
      saveEscudo(next);
      return next;
    });
  };

  const onName = (v: string) => { setName(v); saveTeamName(v); };
  const onPattern = (p: Pattern) => { setPattern(p); savePattern(p); };
  const preview = colors.length ? colors : YOU_EMBLEM;

  return (
    <div className="escudo">
      <div className="escudo-head">
        <Emblem colors={preview} pattern={pattern} size={44} />
        <div className="escudo-txt">
          <span className="escudo-title">{t('team.title')}</span>
          <input
            className="escudo-name"
            type="text"
            value={name}
            maxLength={24}
            placeholder={t('vs.you')}
            onChange={(e) => onName(e.target.value)}
            aria-label={t('team.title')}
          />
        </div>
      </div>

      <span className="escudo-hint">{t('escudo.hint')}</span>
      <div className="escudo-swatches">
        {ESCUDO_PALETTE.map((col) => {
          const i = colors.indexOf(col);
          return (
            <button
              key={col}
              type="button"
              className={`swatch ${i >= 0 ? 'swatch--on' : ''}`}
              style={{ '--sw': col } as CSSProperties}
              onClick={() => toggle(col)}
              aria-pressed={i >= 0}
              aria-label={col}
            >
              {i >= 0 && <span className="swatch-n">{i + 1}</span>}
            </button>
          );
        })}
      </div>

      <span className="escudo-hint">{t('escudo.pattern')}</span>
      <div className="escudo-patterns">
        {PATTERNS.map((p) => (
          <button
            key={p}
            type="button"
            className={`pat ${p === pattern ? 'pat--on' : ''}`}
            onClick={() => onPattern(p)}
            aria-pressed={p === pattern}
            aria-label={p}
          >
            <Emblem colors={preview} pattern={p} size={26} />
          </button>
        ))}
      </div>
    </div>
  );
}