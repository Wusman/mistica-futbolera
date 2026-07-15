import { useId } from 'react';

/* ══════════════════════════════════════════
   crests.tsx — la INSIGNIA del club.

   Cada club tiene arte PROPIO que EVOCA su escudo real: la forma correcta
   (escudo / círculo / óvalo), sus colores de club (estables entre ediciones,
   no el kit de una final) y su elemento distintivo cuando el badge real lo
   lleva de verdad (liver bird, barco, cañón, torre, murciélago…). Dibujo
   original: se parece, no calca. Ninguna heráldica inventada.

   La CLAVE es la firma de colores (`colors.join('|')`): es lo único que llega
   por props (los registros del daily guardan solo colores). Un club sin
   entrada cae al escudo genérico de sus colores.
══════════════════════════════════════════ */

const SHIELD = 'M5 4 L43 4 L43 30 C43 45 24 53 24 53 C24 53 5 45 5 30 Z';
const FALLBACK_STROKE = '#d9b24a'; // = --gold: sólo para clubes sin arte propio

type Frame = 'shield' | 'circle' | 'oval';
interface Crest { frame: Frame; base: string; stroke: string; sw?: number; art: React.ReactNode }

/* Firma de colores → arte del club. El `art` es lo que va DENTRO del clip,
   sobre el `base`; el marco (silueta + filete) lo pone <ClubCrest/>. */
const CLUBS: Record<string, Crest> = {
  // Real Madrid — roundel blanco, aro y corona dorados, banda azul
  '#f4f4f6|#febe10|#1d2b6b': {
    frame: 'circle', base: '#f4f4f6', stroke: '#febe10', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="16.5" fill="none" stroke="#febe10" strokeWidth="1.3" />
        <line x1="11" y1="31" x2="37" y2="21" stroke="#1d2b6b" strokeWidth="3" />
        <path d="M13.5 32 L11 22 L15 26 L18 18 L21 24 L24 15 L27 24 L30 18 L33 26 L37 22 L34.5 32 Z" fill="#febe10" stroke="rgba(0,0,0,.3)" strokeWidth="0.4" />
        <circle cx="12" cy="20.5" r="1.1" fill="#febe10" /><circle cx="24" cy="13" r="1.2" fill="#febe10" /><circle cx="36" cy="20.5" r="1.1" fill="#febe10" />
      </>
    ),
  },
  // Barcelona — cuartel: cruz de San Jorge + senyera arriba, blaugrana abajo
  '#a50044|#004d98|#edbb00': {
    frame: 'shield', base: '#a50044', stroke: '#edbb00', sw: 2.2, art: (
      <>
        <rect x="5" y="4" width="19" height="20" fill="#f4f4f6" />
        <rect x="13" y="6" width="3" height="16" fill="#da291c" /><rect x="6.5" y="12.5" width="16" height="3" fill="#da291c" />
        <rect x="24" y="4" width="19" height="20" fill="#edbb00" />
        <Stripes x0={24} x1={43} y0={4} y1={24} cols={['#da291c', '#edbb00']} n={5} />
        <rect x="5" y="24" width="38" height="1.6" fill="#edbb00" />
        <Stripes x0={5} x1={43} y0={25.6} y1={53} cols={['#004d98', '#a50044']} n={5} />
      </>
    ),
  },
  // Bayern München — aro azul, disco rojo, rombos bávaros al centro
  '#dc052d|#ffffff|#0066b2': {
    frame: 'circle', base: '#0066b2', stroke: '#0066b2', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="17" fill="#ffffff" />
        <circle cx="24" cy="24" r="15" fill="#dc052d" />
        <polygon points="24,13 30,21 24,21 18,21" fill="#ffffff" />
        <polygon points="18,21 24,21 24,29 18,29" fill="#0066b2" />
        <polygon points="24,21 30,21 30,29 24,29" fill="#0066b2" />
        <polygon points="18,29 24,29 24,35 30,29" fill="#ffffff" />
      </>
    ),
  },
  // Liverpool — escudo rojo, liver bird amarillo erguido
  '#c8102e|#f6eb61': {
    frame: 'shield', base: '#c8102e', stroke: '#f6eb61', sw: 2.2, art: (
      <g fill="#f6eb61" stroke="rgba(0,0,0,.28)" strokeWidth="0.4">
        <path d="M21 40 C18 34 18 27 22 23 C21 20 22 16 26 15 L26 20 C24 22 24 26 26 28 C25 32 26 37 27 40 Z" />
        <ellipse cx="24" cy="30" rx="5.5" ry="8" transform="rotate(-8 24 30)" />
        <circle cx="27" cy="14.5" r="2.8" />
        <polygon points="29,13.5 34,15 29,16.5" />
        <path d="M30 12 Q35 8 39 11 Q34 11 33 15 Z" />
        <path d="M28 32 C33 30 36 25 35 20 C31 24 27 25 26 27 Z" />
        <rect x="21.5" y="38" width="1.5" height="5.5" /><rect x="26" y="38" width="1.5" height="5.5" />
        <path d="M20 43.5 L24.5 43.5 M25.5 43.5 L30 43.5" stroke="#f6eb61" strokeWidth="1.4" />
      </g>
    ),
  },
  // Manchester City — círculo celeste, barco arriba, ríos + rosa abajo
  '#6cabdd|#1c2c5b': {
    frame: 'circle', base: '#6cabdd', stroke: '#1c2c5b', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="18.5" fill="none" stroke="#1c2c5b" strokeWidth="1.2" />
        <line x1="8" y1="24" x2="40" y2="24" stroke="#1c2c5b" strokeWidth="1" />
        <g fill="#1c2c5b">
          <path d="M15 19 L33 19 L30 22 L18 22 Z" />
          <rect x="23.4" y="8" width="1.2" height="11" />
          <path d="M25 9 L31 17 L25 17 Z" /><path d="M23 10.5 L18 17 L23 17 Z" />
        </g>
        <g stroke="#1c2c5b" strokeWidth="1.3" fill="none">
          <path d="M10 30 Q17 27 24 30 T38 30" /><path d="M10 34 Q17 31 24 34 T38 34" /><path d="M12 38 Q18 35.5 24 38 T36 38" />
        </g>
        <circle cx="24" cy="34" r="2.4" fill="#da291c" />
      </>
    ),
  },
  // Inter — anillos concéntricos negro/oro/azul, monograma
  '#0a0a0a|#1f4fb6': {
    frame: 'circle', base: '#0a0a0a', stroke: '#0a0a0a', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="19" fill="none" stroke="#c9a227" strokeWidth="1.6" />
        <circle cx="24" cy="24" r="15.5" fill="none" stroke="#1f4fb6" strokeWidth="3" />
        <circle cx="24" cy="24" r="11" fill="#0a0a0a" />
        <g stroke="#c9a227" strokeWidth="1.5" fill="none">
          <line x1="19" y1="19" x2="19" y2="29" /><line x1="24" y1="18" x2="24" y2="30" /><line x1="29" y1="19" x2="29" y2="29" />
          <path d="M17 19 Q24 15 31 19" /><path d="M17 29 Q24 33 31 29" />
        </g>
      </>
    ),
  },
  // AC Milan — mitad rossonera, mitad blanca con cruz roja
  '#f5f5f5|#0a0a0a|#fb090b': {
    frame: 'shield', base: '#f5f5f5', stroke: '#0a0a0a', sw: 2.2, art: (
      <>
        <Stripes x0={5} x1={24} y0={4} y1={53} cols={['#fb090b', '#0a0a0a']} n={4} />
        <rect x="24" y="4" width="19" height="49" fill="#f5f5f5" />
        <rect x="32.5" y="7" width="3" height="34" fill="#fb090b" />
        <rect x="27" y="20" width="14" height="3" fill="#fb090b" />
      </>
    ),
  },
  // Porto — escudo azul con panel blanco, balón, dragón arriba
  '#02488f|#ffffff': {
    frame: 'shield', base: '#02488f', stroke: '#febe10', sw: 2.2, art: (
      <>
        <path d="M13 4 L35 4 L35 30 C35 40 24 46 24 46 C24 46 13 40 13 30 Z" fill="#f4f4f6" />
        <circle cx="24" cy="34" r="6.5" fill="#f4f4f6" stroke="#02488f" strokeWidth="1.1" />
        <polygon points="24,29.5 27.2,31.8 26,35.6 22,35.6 20.8,31.8" fill="#02488f" />
        <g fill="#1f7a44" stroke="rgba(0,0,0,.35)" strokeWidth="0.3">
          <path d="M15 20 C15 15 19 12 24 13 C22 15 23 18 26 18 C24 21 20 21 18 20 C20 22 23 22 25 21 C24 24 19 24 16 22 Z" />
          <path d="M24 13 C27 11 31 12 32 15 C30 15 28 16 27 18 Z" />
          <circle cx="31" cy="13.5" r="1.7" /><polygon points="32.5,12.5 35.5,13.5 32.5,14.5" />
          <circle cx="31.4" cy="13.2" r="0.4" fill="#0a0a0a" stroke="none" />
          <path d="M16 22 L14 26 L17 24 Z" />
        </g>
      </>
    ),
  },
  // Chelsea — círculo azul, aro dorado, león rampante con báculo
  '#034694|#ffffff': {
    frame: 'circle', base: '#034694', stroke: '#f4d24a', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="19" fill="none" stroke="#f4d24a" strokeWidth="1.4" />
        <g fill="#f4d24a" stroke="rgba(0,0,0,.35)" strokeWidth="0.4" strokeLinejoin="round">
          <path d="M16 37 C15 31 16 27 19 25 C16 24 15 20 17 17 C18 20 20 20 22 20 C20 17 22 13 25 13 C24 15 25 17 27 18 C30 19 31 23 30 26 C32 25 34 26 34 29 C33 28 31 29 31 31 C33 31 34 33 33 35 C32 33 30 33 29 35 C29 32 27 31 25 32 C24 30 21 30 20 33 C20 35 18 36 16 37 Z" />
          <circle cx="24.5" cy="16" r="0.7" fill="#034694" stroke="none" />
          <rect x="30" y="11" width="1.4" height="22" transform="rotate(20 30.7 22)" />
          <circle cx="34.5" cy="11" r="1.9" />
        </g>
      </>
    ),
  },
  // Marseille — blanco, "OM" celeste, estrella
  '#ffffff|#2faee0': {
    frame: 'shield', base: '#f4f4f6', stroke: '#2faee0', sw: 2.2, art: (
      <>
        <circle cx="18" cy="30" r="7" fill="none" stroke="#2faee0" strokeWidth="3.2" />
        <path d="M26 37 L26 23 L31 31 L36 23 L36 37" fill="none" stroke="#2faee0" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
        <polygon points="24,7 25.3,11 29.4,11 26,13.6 27.3,17.6 24,15 20.7,17.6 22,13.6 18.6,11 22.7,11" fill="#2faee0" />
      </>
    ),
  },
  // Manchester United — escudo rojo, barco arriba, diablo con tridente
  '#da020e|#0a0a0a|#ffe500': {
    frame: 'shield', base: '#da020e', stroke: '#ffe500', sw: 2.2, art: (
      <>
        <rect x="5" y="4" width="38" height="12" fill="#ffe500" />
        <g fill="#da020e"><path d="M17 12 L31 12 L29 14.5 L19 14.5 Z" /><rect x="23.5" y="6" width="1" height="6" /><path d="M24.5 6.5 L29 11.5 L24.5 11.5 Z" /></g>
        <rect x="5" y="16" width="38" height="1.5" fill="#ffe500" />
        <g fill="#0a0a0a">
          <path d="M24 22 C21.5 22 20.5 24 21 26 C19.5 27 19.5 30 21 31 L20 40 L23 37 L24 40 L25 37 L28 40 L27 31 C28.5 30 28.5 27 27 26 C27.5 24 26.5 22 24 22 Z" />
          <polygon points="20.5,22.5 21.5,20 22.5,22.8" /><polygon points="27.5,22.5 26.5,20 25.5,22.8" />
          <rect x="30" y="24" width="1.1" height="12" />
          <path d="M28.5 24 L33 24 M28.5 24 Q30.7 21 30.5 25 M33 24 Q30.9 21 31.1 25" stroke="#0a0a0a" strokeWidth="1" fill="none" />
        </g>
      </>
    ),
  },
  // Monaco — escudo, diagonal roja/blanca, rombos Grimaldi
  '#e63b3b|#ffffff': {
    frame: 'shield', base: '#f4f4f6', stroke: '#c0303a', sw: 2.2, art: (
      <>
        <polygon points="5,4 43,4 5,42" fill="#e63b3b" />
        <polygon points="24,16 30,24 24,32 18,24" fill="#e63b3b" />
        <polygon points="24,16 30,24 24,24" fill="#f4f4f6" /><polygon points="18,24 24,24 24,32" fill="#f4f4f6" />
        <polygon points="24,16 30,24 24,32 18,24" fill="none" stroke="#c0303a" strokeWidth="0.6" />
      </>
    ),
  },
  // Borussia Dortmund — círculo amarillo, aro negro, "BVB"
  '#fde100|#0a0a0a': {
    frame: 'circle', base: '#fde100', stroke: '#0a0a0a', sw: 2.4, art: (
      <>
        <circle cx="24" cy="24" r="23" fill="#0a0a0a" />
        <circle cx="24" cy="24" r="18" fill="#fde100" />
        <text x="24" y="30" fill="#0a0a0a" fontSize="14" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" letterSpacing="-0.5">BVB</text>
      </>
    ),
  },
  // Atlético Madrid — rayas rojiblancas, banda azul, oso y madroño
  '#cb3524|#ffffff|#1b3d8f': {
    frame: 'shield', base: '#f4f4f6', stroke: '#1b3d8f', sw: 2.2, art: (
      <>
        <Stripes x0={5} x1={43} y0={4} y1={34} cols={['#cb3524', '#f4f4f6']} n={7} />
        <rect x="5" y="34" width="38" height="19" fill="#1b3d8f" />
        <rect x="30.5" y="26" width="1.8" height="18" fill="#5a3b1e" />
        <circle cx="31.4" cy="24" r="5" fill="#1f7a44" />
        <g fill="#0a0a0a" stroke="rgba(0,0,0,.3)" strokeWidth="0.3">
          <path d="M15 44 C14 37 16 31 21 30 C24 29 26 31 26 33 C29 31 31 32 31 34 L28 35 C27 34 25 35 25 37 C23 36 21 37 21 40 L21 44 Z" />
          <circle cx="15.5" cy="31" r="1.3" /><polygon points="14,29.5 15,31 13,31" />
        </g>
      </>
    ),
  },
  // Juventus — óvalo, rayas negras/blancas, toro
  '#0a0a0a|#ffffff': {
    frame: 'oval', base: '#f4f4f6', stroke: '#c9a227', sw: 2.2, art: (
      <>
        <Stripes x0={7} x1={41} y0={2} y1={54} cols={['#0a0a0a', '#f4f4f6']} n={6} />
        <ellipse cx="24" cy="28" rx="9" ry="13" fill="#f4f4f6" />
        <g fill="#0a0a0a">
          <path d="M18 33 C18 28 21 26 24 26 C27 26 30 28 30 33 L27 33 L27 30 L21 30 L21 33 Z" />
          <polygon points="18,26 21,29 18,29" /><polygon points="30,26 27,29 30,29" />
          <rect x="20" y="33" width="1.4" height="4" /><rect x="26.6" y="33" width="1.4" height="4" />
        </g>
      </>
    ),
  },
  // Tottenham — blanco, gallo azul sobre balón
  '#ffffff|#132257': {
    frame: 'shield', base: '#f4f4f6', stroke: '#132257', sw: 2.2, art: (
      <>
        <g fill="#132257">
          <ellipse cx="24" cy="24" rx="6" ry="8" />
          <path d="M24 16 C22 13 24 10 27 10 C25 12 26 13 27 14 Z" />
          <circle cx="27.5" cy="10.5" r="1" /><polygon points="28.5,9.5 30.5,10.5 28.5,11.5" fill="#e0a020" />
          <path d="M30 11 L30 8 L31.5 9 Z" />
          <path d="M18 22 C13 20 12 14 15 11 C15 17 20 19 22 20 Z" />
          <rect x="21" y="31" width="1.3" height="6" /><rect x="26" y="31" width="1.3" height="6" />
        </g>
        <circle cx="24" cy="40" r="6" fill="none" stroke="#132257" strokeWidth="1.4" />
        <path d="M18.5 38 Q24 41 29.5 38" stroke="#132257" strokeWidth="1" fill="none" />
      </>
    ),
  },
  // PSG — azul, banda roja "PARIS", Torre Eiffel roja, flor de lis
  '#004170|#da291c|#ffffff': {
    frame: 'shield', base: '#004170', stroke: '#f4f4f6', sw: 2.2, art: (
      <>
        <rect x="5" y="4" width="38" height="9" fill="#da291c" />
        <text x="24" y="11" fill="#f4f4f6" fontSize="6" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">PARIS</text>
        <g fill="#da291c">
          <path d="M24 15 L21 38 L27 38 Z" />
          <path d="M20 38 L28 38 L29.5 42 L18.5 42 Z" />
          <rect x="21.5" y="24" width="5" height="1.4" /><rect x="20.5" y="30" width="7" height="1.6" />
          <polygon points="24,15 23,20 25,20" />
        </g>
        <g fill="#f4f4f6" stroke="rgba(0,0,0,.2)" strokeWidth="0.3">
          <path d="M24 43 c-1 1.5 -1.4 2.9 -0.75 4.6 h1.5 c0.65 -1.7 0.25 -3.1 -0.75 -4.6 Z" />
          <path d="M23 47.6 c-1.5 0.5 -2.9 -0.3 -3.1 -1.7 c-0.15 -1 0.6 -2 1.7 -2.2 c-0.4 1.5 0.05 2.8 1.4 3.9 Z" />
          <path d="M25 47.6 c1.5 0.5 2.9 -0.3 3.1 -1.7 c0.15 -1 -0.6 -2 -1.7 -2.2 c0.4 1.5 -0.05 2.8 -1.4 3.9 Z" />
        </g>
      </>
    ),
  },
  // Ajax — blanco, banda roja central, cara de Ajax en líneas
  '#f4f4f6|#d2122e': {
    frame: 'shield', base: '#f4f4f6', stroke: '#d2122e', sw: 2.2, art: (
      <>
        <rect x="18" y="4" width="12" height="49" fill="#d2122e" />
        <g stroke="#f4f4f6" strokeWidth="1.1" fill="none" strokeLinecap="round">
          <path d="M20 42 L20 26 Q20 14 27 12" />
          <path d="M20 26 Q24 25 26 21 Q27 18 25 15" />
          <path d="M20 32 L25 30" />
          <path d="M27 12 Q30 13 29 17 L26 21" />
          <path d="M20 38 L24 37" />
        </g>
      </>
    ),
  },
  // Valencia — blanco, franja senyera, murciélago negro arriba
  '#ffffff|#ee3524': {
    frame: 'shield', base: '#f4f4f6', stroke: '#ee3524', sw: 2.2, art: (
      <>
        <Stripes x0={5} x1={43} y0={20} y1={53} cols={['#ee3524', '#febe10']} n={5} />
        <rect x="5" y="18" width="38" height="2" fill="#ee3524" />
        <g fill="#0a0a0a">
          <path d="M24 9 C22 9 22 12 24 12 C26 12 26 9 24 9 Z" />
          <path d="M24 11 C18 8 12 9 7 13 C13 12 15 14 17 16 C18 13 20 12 24 13 C28 12 30 13 31 16 C33 14 35 12 41 13 C36 9 30 8 24 11 Z" />
        </g>
      </>
    ),
  },
  // Bayer Leverkusen — rojo, cruz Bayer en círculo
  '#e32221|#0a0a0a': {
    frame: 'shield', base: '#e32221', stroke: '#0a0a0a', sw: 2.2, art: (
      <>
        <circle cx="24" cy="27" r="14" fill="#0a0a0a" />
        <circle cx="24" cy="27" r="12.5" fill="none" stroke="#f4f4f6" strokeWidth="1" />
        <line x1="10" y1="27" x2="38" y2="27" stroke="#f4f4f6" strokeWidth="1.4" />
        <line x1="24" y1="13" x2="24" y2="41" stroke="#f4f4f6" strokeWidth="1.4" />
        <text x="24" y="24.5" fill="#f4f4f6" fontSize="4.5" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle">BAYER</text>
        <text x="24" y="33.5" fill="#f4f4f6" fontSize="4.5" fontFamily="Arial, sans-serif" fontWeight="bold" textAnchor="middle" transform="rotate(90 24 31)">04</text>
      </>
    ),
  },
};

/* Rayas verticales en [x0,x1]×[y0,y1], alternando `cols`. */
function Stripes({ x0, x1, y0, y1, cols, n }: { x0: number; x1: number; y0: number; y1: number; cols: string[]; n: number }) {
  const w = (x1 - x0) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x0 + i * w} y={y0} width={w + 0.4} height={y1 - y0} fill={cols[i % cols.length]} />
      ))}
    </>
  );
}

/* La insignia del club. Busca el arte por firma de colores; si no hay, cae a
   un escudo genérico con esos colores (defensivo — todo club real tiene arte). */
export function ClubCrest({ colors, size = 48, className }: { colors: string[]; size?: number; className?: string }) {
  const clip = `cc-${useId().replace(/[:]/g, '')}`;
  const club = CLUBS[colors.join('|')];

  if (!club) {
    const w = Math.round((size * 48) / 56);
    const a = colors[0] ?? '#17264f';
    return (
      <svg viewBox="0 0 48 56" width={w} height={size} className={className} role="img" aria-hidden="true">
        <defs><clipPath id={clip}><path d={SHIELD} /></clipPath></defs>
        <g clipPath={`url(#${clip})`}>
          <rect width="48" height="56" fill={a} />
          {colors[1] && <polygon points="0,0 48,0 48,56" fill={colors[1]} />}
        </g>
        <path d={SHIELD} fill="none" stroke={FALLBACK_STROKE} strokeWidth="1.5" />
      </svg>
    );
  }

  const { frame, base, stroke, sw = 2, art } = club;

  if (frame === 'circle') {
    return (
      <svg viewBox="0 0 48 48" width={size} height={size} className={className} role="img" aria-hidden="true">
        <defs><clipPath id={clip}><circle cx="24" cy="24" r="23" /></clipPath></defs>
        <g clipPath={`url(#${clip})`}><rect width="48" height="48" fill={base} />{art}</g>
        <circle cx="24" cy="24" r="23" fill="none" stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }

  if (frame === 'oval') {
    const w = Math.round((size * 48) / 56);
    return (
      <svg viewBox="0 0 48 56" width={w} height={size} className={className} role="img" aria-hidden="true">
        <defs><clipPath id={clip}><ellipse cx="24" cy="28" rx="17" ry="26" /></clipPath></defs>
        <g clipPath={`url(#${clip})`}><rect width="48" height="56" fill={base} />{art}</g>
        <ellipse cx="24" cy="28" rx="17" ry="26" fill="none" stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }

  const w = Math.round((size * 48) / 56);
  return (
    <svg viewBox="0 0 48 56" width={w} height={size} className={className} role="img" aria-hidden="true">
      <defs><clipPath id={clip}><path d={SHIELD} /></clipPath></defs>
      <g clipPath={`url(#${clip})`}><rect width="48" height="56" fill={base} />{art}</g>
      <path d={SHIELD} fill="none" stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}
