/* Escudo del jugador: identidad propia (NO toca semilla ni resultados). Se
   guarda en localStorage y viaja aparte del core determinista. La paleta es
   CURADA a propósito: elegir de acá (no un picker libre) garantiza que el
   escudo siempre se vea bien, es IP-safe, y encodea barato en el share-code
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
import { TEAMS } from '../data/players';

/* ── Patrones del escudo ── vocabulario propio tipo camiseta (IP-safe). El
   jugador elige el suyo; los equipos existentes reciben uno determinista. */
/* ORDEN CONGELADO: el índice viaja en el share-code (4 bits). Patrones nuevos
   se agregan SOLO AL FINAL. band = banda vertical central (con filos del 3er
   color); chest = franja horizontal al pecho. */
/* Ornamentos HERÁLDICOS GENÉRICOS (corona, rondel, cruz): vocabulario
   universal de escudos, curado por equipo para evocar SIN reproducir el
   badge real. Las estrellas son un hecho histórico (Copas de Europa hasta
   esa edición), tope visual 5. Nada de esto viaja en el share-code: es
   identidad de EQUIPO (dataset), no del jugador. */
export type Ornament = 'crown' | 'roundel' | 'cross';

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

/* Determinista desde los colores del equipo (mismo equipo → mismo patrón),
   elegido por NUESTRO sistema, nunca calcado de la camiseta real. */
/* Patrón determinista por equipo. Primero la CURADURÍA del dataset (cada
   equipo declara el patrón que evoca su camiseta histórica — geometría
   genérica, jamás el escudo real); si no hay, hash estable de los colores.
   La clave son los colores: los registros viejos del daily (que guardan solo
   colores) heredan la curaduría gratis. */
interface TeamStyle { pattern?: Pattern; ornament?: Ornament; stars?: number }
let CURATED: Map<string, TeamStyle> | null = null; // LAZY: jamás tocar TEAMS en el init del módulo (ciclos)

/* Clave = colores. Equipos con MISMOS colores (ediciones del mismo club)
   comparten estilo; para estrellas se toma el MÍNIMO de las ediciones —
   nunca sobredeclara honores (ej.: PSG 2020 finalista no hereda la copa
   del 2025). Con el tope visual de 5, el costo es invisible. */
function curated(): Map<string, TeamStyle> {
  if (!CURATED) {
    CURATED = new Map();
    for (const tm of TEAMS) {
      const key = tm.colors.join('|');
      const prev = CURATED.get(key);
      CURATED.set(key, {
        pattern: tm.pattern ?? prev?.pattern,
        ornament: tm.ornament ?? prev?.ornament,
        stars: prev?.stars !== undefined || tm.stars !== undefined
          ? Math.min(prev?.stars ?? Infinity, tm.stars ?? Infinity)
          : undefined,
      });
    }
  }
  return CURATED;
}

export function teamOrnament(colors: string[]): Ornament | undefined {
  return curated().get(colors.join('|'))?.ornament;
}

export function teamStars(colors: string[]): number {
  const s = curated().get(colors.join('|'))?.stars;
  return s && s !== Infinity ? s : 0;
}

export function teamPattern(colors: string[]): Pattern {
  const key = colors.join('|');
  const curatedStyle = curated().get(key)?.pattern;
  if (curatedStyle) return curatedStyle;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return PATTERNS[(h >>> 0) % PATTERNS.length];
}