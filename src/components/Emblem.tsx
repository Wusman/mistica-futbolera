import { useId } from 'react';
import { YOU_EMBLEM } from '../config';
import { type Pattern } from '../lib/escudo';

/* La insignia del CLUB (arte propio por club) vive en su módulo; se re-exporta
   con el nombre histórico para no tocar los sitios de uso. El <Emblem/> de acá
   es el escudo GENERATIVO del jugador (colores + patrón), otra cosa. */
export { ClubCrest as TeamCrest } from './crests';

interface Props {
  colors: string[];      // 1–3 colores PROPIOS del jugador (no crest real)
  pattern?: Pattern;     // patrón; por defecto se deriva de la cantidad de colores
  size?: number;         // alto en px (default 48)
  className?: string;
}

const GOLD = '#d9b24a'; // = --gold del tema (canónico, IDENTIDAD §2); si cambia uno, cambia el otro
/* Un solo path de escudo, IGUAL para todos → sistema propio, no reproduce ningún
   crest. La identidad la dan el color y el patrón, no la forma. */
const SHIELD = 'M6 5 L42 5 L42 32 C42 44 24 51 24 51 C24 51 6 44 6 32 Z';

/* Escudo generativo del JUGADOR: presentación pura, determinista desde colores
   + patrón. Sin azar, sin marcas reales. Todos los patrones son simétricos
   respecto al eje (x=24), salvo diagonal y banda que son asimétricos a propósito. */
export function Emblem({ colors, pattern, size = 48, className }: Props) {
  const raw = useId().replace(/[:]/g, '');
  const clip = `emb-${raw}`;
  const cs = colors.length ? colors.slice(0, 3) : YOU_EMBLEM;
  const pat: Pattern = pattern ?? (cs.length === 1 ? 'solid' : cs.length >= 3 ? 'vstripe' : 'diagonal');
  const w = Math.round((size * 48) / 56);

  return (
    <svg viewBox="0 0 48 56" width={w} height={size} className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Fill pat={pat} cs={cs} />
        {/* arco de cancha sutil: textura de fútbol propia */}
        <path d="M6 34 Q24 41 42 34" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="5" />
      </g>
      {/* bordure: el 3er color como ribete interno (piping), heráldica clásica */}
      {cs[2] && cs[2] !== cs[0] && (
        <path d="M8.2 7.2 L39.8 7.2 L39.8 31.4 C39.8 41.5 24 48.4 24 48.4 C24 48.4 8.2 41.5 8.2 31.4 Z" fill="none" stroke={cs[2]} strokeWidth="1.6" />
      )}
      {/* filete dorado — atributos SVG (no CSS) para evitar el bug de rect negro */}
      <path d={SHIELD} fill="none" stroke={GOLD} strokeWidth="1.5" />
    </svg>
  );
}

function Fill({ pat, cs }: { pat: Pattern; cs: string[] }) {
  const a = cs[0];
  const b = cs[1] ?? cs[0];
  const c = cs[2] ?? a;
  switch (pat) {
    case 'solid':
      return <rect width="48" height="56" fill={a} />;
    case 'halves':
      return (
        <>
          <rect width="24" height="56" fill={a} />
          <rect x="24" width="24" height="56" fill={b} />
        </>
      );
    case 'vstripe':
      /* Rayas de CAMISETA: siempre a sobre b (blaugrana, rojiblanco,
         nerazzurro). El 3er color no es franja: viaja como BORDURE. */
      return (
        <>
          <rect width="48" height="56" fill={b} />
          <rect x="0" width="9.6" height="56" fill={a} />
          <rect x="19.2" width="9.6" height="56" fill={a} />
          <rect x="38.4" width="9.6" height="56" fill={a} />
        </>
      );
    case 'vtri':
      return (
        <>
          <rect width="16" height="56" fill={a} />
          <rect x="16" width="16" height="56" fill={b} />
          <rect x="32" width="16" height="56" fill={c} />
        </>
      );
    case 'htri':
      return (
        <>
          <rect width="48" height="19" fill={a} />
          <rect y="19" width="48" height="19" fill={b} />
          <rect y="38" width="48" height="18" fill={c} />
        </>
      );
    case 'sash':
      return (
        <>
          <rect width="48" height="56" fill={a} />
          <polygon points="0,48 48,0 48,16 8,56 0,56" fill={b} />
        </>
      );
    case 'hoops':
      return (
        <>
          <rect width="48" height="56" fill={b} />
          <rect y="10" width="48" height="6" fill={a} />
          <rect y="22" width="48" height="6" fill={c} />
          <rect y="34" width="48" height="6" fill={a} />
        </>
      );
    case 'band':
      return (
        <>
          <rect width="48" height="56" fill={a} />
          <rect x="14" width="2.5" height="56" fill={c} />
          <rect x="16.5" width="15" height="56" fill={b} />
          <rect x="31.5" width="2.5" height="56" fill={c} />
        </>
      );
    case 'chest':
      return (
        <>
          <rect width="48" height="56" fill={a} />
          <rect y="18" width="48" height="2.5" fill={c} />
          <rect y="20.5" width="48" height="15" fill={b} />
          <rect y="35.5" width="48" height="2.5" fill={c} />
        </>
      );
    case 'chevron':
      return (
        <>
          <rect width="48" height="56" fill={a} />
          <polygon points="0,18 24,34 48,18 48,30 24,46 0,30" fill={b} />
        </>
      );
    case 'quarters':
      return (
        <>
          <rect width="24" height="28" fill={a} />
          <rect x="24" width="24" height="28" fill={b} />
          <rect y="28" width="24" height="28" fill={b} />
          <rect x="24" y="28" width="24" height="28" fill={a} />
        </>
      );
    case 'diagonal':
    default:
      return (
        <>
          <rect width="48" height="56" fill={b} />
          <polygon points="0,0 48,0 48,56" fill={a} />
        </>
      );
  }
}
