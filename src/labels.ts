import { type Pos } from './data/players';
import { type Locale } from './i18n';

/* Etiquetas de posición. 'es' usa las abreviaturas en español; el resto de
   los idiomas usan el código canónico (GK, CB, ...), que ya es estándar. */
export const POS_LABEL: Record<Pos, string> = {
  GK: 'ARQ',
  RB: 'LD',
  CB: 'DFC',
  LB: 'LI',
  DM: 'MCD',
  CM: 'MC',
  AM: 'MCO',
  RM: 'MD',
  LM: 'MI',
  RW: 'ED',
  LW: 'EI',
  ST: 'DC',
};

export function posLabel(pos: Pos, locale: Locale): string {
  return locale === 'es' ? POS_LABEL[pos] : pos;
}