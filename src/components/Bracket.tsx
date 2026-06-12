import { useT } from '../i18n';

/* ── Geometría (viewBox 340×120): dos alas de slots que convergen a la copa.
   Cada ronda = slots redondeados (sin nombres) + conectores; lo que falta va
   punteado, lo recorrido sólido. fills/strokes críticos van como ATRIBUTOS
   del SVG (no solo CSS): si una hoja de estilos falta, esto jamás se rellena
   de negro. El color fino lo pone el CSS por encima. ── */

const SLOT_W = 20;
const SLOT_H = 8;

/* Columnas (borde izquierdo de cada slot) y centros verticales por ronda. */
const COL = { r16: 4, qf: 40, sf: 76, f: 112 };
const Y16 = [10, 24, 38, 52, 66, 80, 94, 108];
const YQF = [17, 45, 73, 101];
const YSF = [31, 87];
const YF = 59;
const CUP_X = 170;

/* Conector de llave: sale de dos slots, los une y avanza al siguiente. */
const link = (xRight: number, y1: number, y2: number, dir: 1 | -1) => {
  const a = xRight + 2 * dir;
  const v = a + 6 * dir;
  const out = v + 10 * dir;
  return `M${a},${y1} H${v} V${y2} H${a} M${v},${(y1 + y2) / 2} H${out}`;
};

const pair = <T,>(arr: readonly T[]): T[][] => arr.reduce<T[][]>((acc, v, i) => {
  if (i % 2 === 0) acc.push([v]); else acc[acc.length - 1].push(v);
  return acc;
}, []);

interface Props { stageIdx: number; }

/* Bracket guía: solo la forma del camino al título, con tu ronda iluminada
   y tu llave marcada (slot pulsante). Presentación pura. */
export function Bracket({ stageIdx }: Props) {
  const t = useT();
  const state = (round: number) => (stageIdx === round ? 'on' : stageIdx > round ? 'done' : 'off');

  const slot = (x: number, cy: number, round: number, you = false) => (
    <rect
      key={`${x}:${cy}`}
      className={`br-slot br-slot--${state(round)} ${you ? 'br-slot--you' : ''}`}
      x={x} y={cy - SLOT_H / 2} width={SLOT_W} height={SLOT_H} rx="2.5"
      fill="rgba(255,255,255,0.05)" stroke="rgba(147,160,200,0.45)" strokeWidth="1"
    />
  );

  const links = (xCol: number, ys: readonly number[], round: number, dir: 1 | -1) => {
    const xRight = dir === 1 ? xCol + SLOT_W : 340 - xCol - SLOT_W;
    return pair(ys).map(([y1, y2]) => (
      <path
        key={`${xCol}:${y1}:${dir}`}
        className={`br-link br-link--${state(round)}`}
        d={link(xRight, y1, y2, dir)}
        fill="none" stroke="rgba(147,160,200,0.45)" strokeWidth="1.6"
        strokeDasharray={stageIdx >= round ? undefined : '3 3'}
      />
    ));
  };

  /* x espejado del ala derecha para un slot. */
  const mx = (x: number) => 340 - x - SLOT_W;

  const rounds: { col: number; ys: readonly number[]; round: number }[] = [
    { col: COL.r16, ys: Y16, round: 2 },
    { col: COL.qf, ys: YQF, round: 3 },
    { col: COL.sf, ys: YSF, round: 4 },
  ];

  return (
    <div className="bracket" role="img" aria-label={t('bracket.aria')}>
      <span className={`br-chip br-chip--${stageIdx < 2 ? 'on' : 'done'}`}>
        {t('bracket.group')}
      </span>
      <svg viewBox="0 0 340 120">
        {rounds.map(({ col, ys, round }) => (
          <g key={round}>
            {ys.map((y, i) => slot(col, y, round, stageIdx === round && i === 0))}
            {ys.map((y) => slot(mx(col), y, round))}
            {links(col, ys, round, 1)}
            {links(col, ys, round, -1)}
          </g>
        ))}

        {/* Final: dos slots llegando a la copa. */}
        {slot(COL.f, YF, 5, stageIdx === 5)}
        {slot(mx(COL.f), YF, 5)}
        <path
          className={`br-link br-link--${state(5)}`}
          d={`M${COL.f + SLOT_W + 2},${YF} H${CUP_X - 16} M${mx(COL.f) - 2},${YF} H${CUP_X + 16}`}
          fill="none" stroke="rgba(147,160,200,0.45)" strokeWidth="1.6"
          strokeDasharray={stageIdx >= 5 ? undefined : '3 3'}
        />

        {/* Copa genérica (identidad propia, nada de orejonas). */}
        <g className={`br-cup br-cup--${state(5)}`} fill="rgba(147,160,200,0.5)">
          <path d={`M${CUP_X - 7},${YF - 11} h14 v5 a7 7 0 0 1 -14 0 z`} />
          <rect x={CUP_X - 1.6} y={YF + 1} width="3.2" height="5" rx="1" />
          <rect x={CUP_X - 5} y={YF + 6.5} width="10" height="2.6" rx="1" />
        </g>
      </svg>
    </div>
  );
}