import { type Pos } from './data/players';
import { type Locale } from './i18n';

/* Etiquetas de posición por idioma, con las abreviaturas que cada mercado
   reconoce de los juegos de fútbol. 'en' usa el código canónico del dataset.
   es: español neutro/España (POR = portero, no ARQ).
   pt: neutro con base BR (GOL, ZAG, VOL, MEI, ATA).
   fr: abreviaturas francesas (G, DC, MDC, BU). */
const POS_LABELS: Record<Exclude<Locale, 'en'>, Record<Pos, string>> = {
  es: {
    GK: 'POR', RB: 'LD', CB: 'DFC', LB: 'LI',
    DM: 'MCD', CM: 'MC', AM: 'MCO', RM: 'MD', LM: 'MI',
    RW: 'ED', LW: 'EI', ST: 'DC',
  },
  pt: {
    GK: 'GOL', RB: 'LD', CB: 'ZAG', LB: 'LE',
    DM: 'VOL', CM: 'MC', AM: 'MEI', RM: 'MD', LM: 'ME',
    RW: 'PD', LW: 'PE', ST: 'ATA',
  },
  fr: {
    GK: 'G', RB: 'DD', CB: 'DC', LB: 'DG',
    DM: 'MDC', CM: 'MC', AM: 'MOC', RM: 'MD', LM: 'MG',
    RW: 'AD', LW: 'AG', ST: 'BU',
  },
};

export function posLabel(pos: Pos, locale: Locale): string {
  return locale === 'en' ? pos : POS_LABELS[locale][pos];
}