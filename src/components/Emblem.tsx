import { useId } from 'react';
import { YOU_EMBLEM } from '../config';

interface Props {
  colors: string[];   // 1–3 colores PROPIOS del equipo (no crest real)
  size?: number;      // alto en px (default 48)
  className?: string;
}

const GOLD = '#d9b24a';
/* Un solo path de escudo, IGUAL para todos → sistema propio, no reproduce ningún
   crest. La identidad la da el color, no la forma. */
const SHIELD = 'M6 5 L42 5 L42 32 C42 44 24 51 24 51 C24 51 6 44 6 32 Z';

/* Escudo generativo: presentación pura, determinista desde los colores (dato).
   Sin azar, sin marcas reales. 1 color = pleno; 2 = corte diagonal (camiseta);
   3 = tres franjas. Filete dorado en todos (la joya). */
export function Emblem({ colors, size = 48, className }: Props) {
  const raw = useId().replace(/[:]/g, '');
  const clip = `emb-${raw}`;
  const cs = colors.length ? colors.slice(0, 3) : YOU_EMBLEM;
  const w = Math.round((size * 48) / 56);

  return (
    <svg viewBox="0 0 48 56" width={w} height={size} className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Fill cs={cs} />
        {/* arco de cancha sutil: textura de fútbol propia */}
        <path d="M6 34 Q24 41 42 34" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="5" />
      </g>
      {/* filete dorado — atributos SVG (no CSS) para evitar el bug de rect negro */}
      <path d={SHIELD} fill="none" stroke={GOLD} strokeWidth="1.5" />
    </svg>
  );
}

function Fill({ cs }: { cs: string[] }) {
  if (cs.length === 1) {
    return <rect x="0" y="0" width="48" height="56" fill={cs[0]} />;
  }
  if (cs.length === 2) {
    return (
      <>
        <rect x="0" y="0" width="48" height="56" fill={cs[1]} />
        <polygon points="0,0 48,0 48,56" fill={cs[0]} />
      </>
    );
  }
  return (
    <>
      <rect x="0" y="0" width="16" height="56" fill={cs[0]} />
      <rect x="16" y="0" width="16" height="56" fill={cs[1]} />
      <rect x="32" y="0" width="16" height="56" fill={cs[2]} />
    </>
  );
}