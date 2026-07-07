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