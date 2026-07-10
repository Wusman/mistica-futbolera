/* Shim SOLO de typecheck: el bundle del worker arrastra src/lib/escudo.ts y
   src/lib/daily.ts por sus exports puros (paleta, patrones, fechas); sus
   helpers de localStorage son CÓDIGO MUERTO en workerd — jamás se ejecutan.
   Declaramos lo mínimo para que `tsc -p workers/daily-champions` cierre sin
   mentirle al runtime. */
declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};