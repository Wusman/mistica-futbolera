/* Escudo del jugador: identidad propia (NO toca semilla ni resultados). Se
   guarda en localStorage y viaja aparte del core determinista. La paleta es
   CURADA a propósito: elegir de acá (no un picker libre) garantiza que el
   escudo siempre se vea bien, y encodea barato en el share-code
   (Paso 3: un índice por color = pocos bits). */

const KEY = 'mf.escudo.v1';

/* 14 colores futboleros propios, legibles sobre la superficie noche. */
export const ESCUDO_PALETTE = [
  '#c0203a', // rojo
  '#7d1122', // granate
  '#e2673a', // naranja
  '#e6b23c', // ámbar
  '#ece7d8', // crema
  '#1f9257', // verde
  '#0e6f63', // verde azulado
  '#2f6bd6', // azul
  '#17264f', // navy
  '#63b0e8', // celeste
  '#6b3fb0', // violeta
  '#14141c', // casi negro
  '#9a6b3f', // bronce
  '#aeb6c6', // acero
];

export function loadEscudo(): string[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) && arr.length ? (arr as string[]).slice(0, 3) : null;
  } catch {
    return null;
  }
}

export function saveEscudo(colors: string[]): void {
  try {
    if (colors.length) localStorage.setItem(KEY, JSON.stringify(colors.slice(0, 3)));
    else localStorage.removeItem(KEY);
  } catch {
    /* almacenamiento no disponible: el escudo cae al default de marca */
  }
}

/* Nombre del equipo (identidad, no juego). Vacío → la UI usa "Tu once". */
const NAME_KEY = 'mf.team.v1';

export function loadTeamName(): string {
  try {
    return (localStorage.getItem(NAME_KEY) ?? '').slice(0, 24);
  } catch {
    return '';
  }
}

export function saveTeamName(name: string): void {
  try {
    const n = name.trim().slice(0, 24);
    if (n) localStorage.setItem(NAME_KEY, n);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}
/* ── Patrones del escudo del JUGADOR ── vocabulario propio tipo camiseta. El
   jugador elige el suyo; el índice viaja en el share-code (4 bits). ORDEN
   CONGELADO: patrones nuevos se agregan SOLO AL FINAL. band = banda vertical
   central (con filos del 3er color); chest = franja horizontal al pecho.
   (La insignia de los CLUBES es arte propio por club en components/crests.tsx,
   no usa este vocabulario.) */
export const PATTERNS = ['solid', 'halves', 'vstripe', 'vtri', 'htri', 'diagonal', 'sash', 'hoops', 'chevron', 'quarters', 'band', 'chest'] as const;
export type Pattern = (typeof PATTERNS)[number];

const PAT_KEY = 'mf.pattern.v1';

export function loadPattern(): Pattern {
  try {
    const p = localStorage.getItem(PAT_KEY);
    return p && (PATTERNS as readonly string[]).includes(p) ? (p as Pattern) : 'diagonal';
  } catch {
    return 'diagonal';
  }
}

export function savePattern(p: Pattern): void {
  try {
    localStorage.setItem(PAT_KEY, p);
  } catch {
    /* ignore */
  }
}

