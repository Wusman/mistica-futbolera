/* ══════════════════════════════════════════
   advice.ts — consejo determinista al quedar eliminado.

   Lee la corrida (stats agregadas + último partido + media del once) y
   devuelve UNA lección accionable, elegida por prioridad de causa raíz:
   nada de random — misma corrida, mismo consejo. El copy vive en i18n
   (claves advice.*) con tono de relator, sin regaño.
══════════════════════════════════════════ */
import type { Stage } from './tournament';

export interface Advice {
  key: string;
  params?: Record<string, string | number>;
}

const AVG_FLOOR = 84;   // por debajo, el draft es la causa raíz (tunable)
const GA_LEAK = 2;      // goles recibidos por partido que delatan la defensa
const GF_DROUGHT = 1;   // goles a favor por partido que delatan el ataque

export function adviceFor(opts: {
  stats: { w: number; d: number; l: number; gf: number; ga: number };
  lostOnPens: boolean;
  stage: Stage;
  xiAvg: number;
}): Advice {
  const { stats: s, lostOnPens, stage, xiAvg } = opts;
  const played = Math.max(1, s.w + s.d + s.l);

  if (lostOnPens) return { key: 'advice.pens' };
  if (xiAvg < AVG_FLOOR) return { key: 'advice.draft', params: { avg: xiAvg } };
  if (stage === 'g1' || stage === 'g2') return { key: 'advice.groups' };
  if (s.ga / played >= GA_LEAK) return { key: 'advice.defense', params: { ga: s.ga } };
  if (s.gf / played <= GF_DROUGHT) return { key: 'advice.attack', params: { gf: s.gf } };
  return { key: 'advice.close' };
}