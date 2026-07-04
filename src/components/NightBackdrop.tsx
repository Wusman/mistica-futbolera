/* ── El fondo de la noche europea (IDENTIDAD.md §3) ──
   Presentación pura y estática: la geometría de una cancha GIGANTE,
   descentrada y recortada, que se dibuja una sola vez al cargar (CSS,
   stroke-dashoffset), un haz de luz frío y grano de transmisión.
   Cero props, cero estado, cero loops. La geometría de una cancha es
   patrimonio del fútbol, no de ninguna competición: IP limpia. */
export function NightBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="bd-geo" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Círculo central + punto + línea de mitad, corridos a la derecha */}
        <circle className="d1" cx="1060" cy="410" r="330" />
        <circle className="d2" cx="1060" cy="410" r="7" />
        <line className="d2" x1="1060" y1="-40" x2="1060" y2="840" />
        {/* Área grande, área chica y semicírculo, entrando desde la izquierda */}
        <path className="d3" d="M -40 620 L 300 620 L 300 180 L -40 180" />
        <path className="d3" d="M -40 520 L 160 520 L 160 280 L -40 280" />
        <path className="d3" d="M 300 340 A 90 90 0 0 1 300 460" />
      </svg>
      <span className="bd-flood" />
      <span className="bd-grain" />
    </div>
  );
}