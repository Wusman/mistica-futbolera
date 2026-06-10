/* ── Marcas de cancha en SVG ──
   Dibujo genérico e IP-safe (cualquier cancha del mundo se ve así).
   viewBox 68×100 = el aspect-ratio del contenedor .pitch, así las
   coordenadas son las mismas que usan los slots (x,y en %).
   vector-effect="non-scaling-stroke" mantiene el trazo nítido. */
export function PitchMarkings() {
  return (
    <svg className="pitch-markings" viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true">
      {/* perímetro + mediocampo */}
      <rect x="1.5" y="1.5" width="65" height="97" />
      <line x1="1.5" y1="50" x2="66.5" y2="50" />
      <circle cx="34" cy="50" r="8.5" />
      <circle className="mk-fill" cx="34" cy="50" r="0.7" />

      {/* área rival (arriba): grande, chica, punto penal y media luna */}
      <rect x="14" y="1.5" width="40" height="14" />
      <rect x="24" y="1.5" width="20" height="5.5" />
      <circle className="mk-fill" cx="34" cy="11" r="0.7" />
      <path d="M 27.4 15.5 A 8 8 0 0 0 40.6 15.5" />

      {/* área propia (abajo) */}
      <rect x="14" y="84.5" width="40" height="14" />
      <rect x="24" y="93" width="20" height="5.5" />
      <circle className="mk-fill" cx="34" cy="89" r="0.7" />
      <path d="M 27.4 84.5 A 8 8 0 0 1 40.6 84.5" />

      {/* córneres */}
      <path d="M 1.5 4.5 A 3 3 0 0 0 4.5 1.5" />
      <path d="M 63.5 1.5 A 3 3 0 0 0 66.5 4.5" />
      <path d="M 66.5 95.5 A 3 3 0 0 0 63.5 98.5" />
      <path d="M 4.5 98.5 A 3 3 0 0 0 1.5 95.5" />
    </svg>
  );
}