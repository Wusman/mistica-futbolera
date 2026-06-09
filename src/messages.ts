/* ══════════════════════════════════════════
   MESSAGES — messages.ts
   Flavor / verdict text. UI-only, deterministic selection (no Math.random).
   Spanish for now; the shape is i18n-ready — añadir 'en' | 'pt' | 'fr' es
   sumar claves al DICT, sin tocar la lógica.

   CONTEXTO: las frases de victoria/empate/derrota (win_*, draw, loss*) son de
   FASE DE GRUPOS (hablan de puntos). Las ko_* son de ELIMINACIÓN (avance, sin
   puntos). pens_win también es de eliminación.
══════════════════════════════════════════ */

export type Locale = 'es'; // luego: 'es' | 'en' | 'pt' | 'fr'

export type Cat =
  | 'win_rout' | 'win_clear' | 'win_narrow' | 'draw' | 'loss' | 'loss_heavy'
  | 'ko_rout' | 'ko_clear' | 'ko_narrow' | 'pens_win'
  | 'group_must_win'
  | 'out_g' | 'out_r16' | 'out_qf' | 'out_sf' | 'out_final' | 'champion'
  | 'scout_fav' | 'scout_even' | 'scout_dog';

const DICT: Record<Locale, Record<Cat, string[]>> = {
  es: {
    /* ── Fase de grupos (puntos) ── */
    win_rout: [
      '¡Baile! Tres puntos y festejo.',
      'Goleada. El grupo, bien encaminado.',
      'Festival de goles. Suman de a tres.',
      'Pasaron por arriba. Puntazo enorme.',
    ],
    win_clear: [
      'Triunfo claro. Tres puntos al bolsillo.',
      'Victoria sólida para el grupo.',
      'Ganaron bien y suman de a tres.',
    ],
    win_narrow: [
      'Ganaron sufriendo, pero suman tres.',
      'Por poco, pero los tres puntos quedan.',
      'Sufrido. En el grupo lo que importa es ganar.',
    ],
    draw: [
      'Empate. Un punto y a seguir.',
      'Igualados. Reparto de puntos.',
      'Empate trabado. Suma, pero poco.',
    ],
    loss: [
      'Tropezón en el grupo. A recuperarse.',
      'Derrota. Se complica el grupo.',
      'Cayeron. Hay que reaccionar ya.',
    ],
    loss_heavy: [
      'Baile en contra. El grupo, en rojo.',
      'Goleada en contra. Mal momento.',
      'Los pasaron por arriba. A levantarse.',
    ],

    /* ── Eliminación directa (avance, sin puntos) ── */
    ko_rout: [
      'Goleada y a otra cosa.',
      'Paliza. Ni se presentaron.',
      'Festival. Sin discusión.',
    ],
    ko_clear: [
      'Trámite resuelto.',
      'Con autoridad, sin sustos.',
      'Lo controlaron de punta a punta.',
    ],
    ko_narrow: [
      'Sufrido, pero lo sacaron adelante.',
      'Por un pelo, pero alcanzó.',
      'Agónico. Aguantaron como leones.',
    ],
    pens_win: [
      '¡Penales! Aguantaron los nervios.',
      'Desde los doce pasos, heroicos.',
      'Tanda dramática, y la metieron.',
    ],

    group_must_win: [
      'Hay que ganar para seguir vivos.',
      'Sin victoria, no hay mañana.',
      'Final anticipada: o ganan, o afuera.',
    ],

    /* ── Eliminación de campaña (por etapa) ── */
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

    /* ── Tensión previa (tu media vs el rival) ── */
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