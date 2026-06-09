/* ══════════════════════════════════════════
   MESSAGES — messages.ts
   Flavor / verdict text. UI-only, deterministic selection (no Math.random).
   Spanish for now; the shape is i18n-ready — añadir 'en' | 'pt' | 'fr' es
   sumar claves al DICT, sin tocar la lógica.
══════════════════════════════════════════ */

export type Locale = 'es'; // luego: 'es' | 'en' | 'pt' | 'fr'

export type Cat =
  | 'win_rout' | 'win_clear' | 'win_narrow' | 'draw' | 'loss' | 'loss_heavy'
  | 'pens_win' | 'pens_loss'
  | 'group_must_win'
  | 'out_g' | 'out_r16' | 'out_qf' | 'out_sf' | 'out_final' | 'champion'
  | 'scout_fav' | 'scout_even' | 'scout_dog';

const DICT: Record<Locale, Record<Cat, string[]>> = {
  es: {
    win_rout: [
      '¡Baile! Les pasaron por arriba.',
      'Goleada de época. No la vieron venir.',
      'Festival de goles. El rival pidió la hora.',
    ],
    win_clear: [
      'Victoria con autoridad.',
      'Lo controlaron de principio a fin.',
      'Triunfo sólido, sin sobresaltos.',
    ],
    win_narrow: [
      'Ganaron sufriendo. Vale igual.',
      'Por un pelo, pero adentro.',
      'Sufrido, pero los tres puntos quedan en casa.',
    ],
    draw: [
      'Empate. Faltó el golpe final.',
      'Igualados. Se reparten todo.',
      'Empate trabado. Cada uno por su lado.',
    ],
    loss: [
      'Derrota. Otra semilla será.',
      'Cayeron. A levantar la cabeza.',
      'No alcanzó. Duele, pero sigue.',
    ],
    loss_heavy: [
      'Baile en contra. A rearmar el once.',
      'Goleada en contra. Para el olvido.',
      'Los pasaron por arriba. Lección dura.',
    ],
    pens_win: [
      '¡Penales! Aguantaron los nervios.',
      'Desde los doce pasos, heroicos.',
      'Tanda dramática, pero adentro.',
    ],
    pens_loss: [
      'Penales fatales. Tan cerca.',
      'Cayeron en la lotería de los doce pasos.',
      'La tanda fue cruel. Se va así.',
    ],
    group_must_win: [
      'Hay que ganar para seguir vivos.',
      'Sin victoria, no hay mañana.',
      'Final anticipada: o ganan, o afuera.',
    ],
    out_g: [
      'Afuera en fase de grupos. Papelón.',
      'Eliminados en la fase de grupos. Para el olvido.',
      'Ni el grupo pudieron pasar. A revisar todo.',
    ],
    out_r16: [
      'Eliminados en Octavos. Cortito el sueño.',
      'Octavos y a casa. Esperabas más.',
    ],
    out_qf: [
      'Cuartos y afuera. Faltó poco.',
      'Eliminados en Cuartos. Tan cerca de la cima.',
    ],
    out_sf: [
      'Tan cerca… Caíste en Semis. Te moriste en la orilla.',
      'Semis. A un paso de la gloria, y nada.',
    ],
    out_final: [
      'Subcampeón. Perdiste LA final. Duele como ninguna.',
      'Tan cerca de todo… subcampeón. Qué bronca.',
    ],
    champion: [
      '¡CAMPEÓN! Rey de Europa.',
      '¡La gloria es tuya! Campeón.',
      '¡Lo lograste! Campeón de Europa.',
    ],
    scout_fav: [
      'Sos amplio favorito. No te relajes.',
      'En los papeles, paliza tuya. A confirmarlo.',
    ],
    scout_even: [
      'Mano a mano. Lo define un detalle.',
      'Parejo de verdad. Cualquier cosa puede pasar.',
    ],
    scout_dog: [
      'David contra Goliat. A dar el batacazo.',
      'Te tocó un monstruo. A meterla toda.',
    ],
  },
};

/* Deterministic pick: same n → same variant. Pass a number derived from the
   match facts (gf, ga, stage…) so distinct matches get distinct lines. */
export function flavor(cat: Cat, n: number, locale: Locale = 'es'): string {
  const arr = DICT[locale][cat];
  return arr[(n >>> 0) % arr.length];
}