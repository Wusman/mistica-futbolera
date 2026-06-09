/* ══════════════════════════════════════════
   MESSAGES — messages.ts
   Frases de veredicto. Selección determinista (sin Math.random).
   'es' y 'en' completos; 'pt'/'fr' caen a 'es' hasta traducirlos.
   win_()draw/loss* = fase de grupos (puntos). ko_pens_win = eliminación. 
══════════════════════════════════════════ */
import { type Locale } from './i18n';

export type Cat =
  | 'win_rout' | 'win_clear' | 'win_narrow' | 'draw' | 'loss' | 'loss_heavy'
  | 'ko_rout' | 'ko_clear' | 'ko_narrow' | 'pens_win'
  | 'group_must_win'
  | 'out_g' | 'out_r16' | 'out_qf' | 'out_sf' | 'out_final' | 'champion'
  | 'scout_fav' | 'scout_even' | 'scout_dog';

const DICT: Record<Locale, Partial<Record<Cat, string[]>>> = {
  es: {
    win_rout: ['¡Baile! Tres puntos y festejo.', 'Goleada. El grupo, bien encaminado.', 'Festival de goles. Suman de a tres.', 'Pasaron por arriba. Puntazo enorme.'],
    win_clear: ['Triunfo claro. Tres puntos al bolsillo.', 'Victoria sólida para el grupo.', 'Ganaron bien y suman de a tres.'],
    win_narrow: ['Ganaron sufriendo, pero suman tres.', 'Por poco, pero los tres puntos quedan.', 'Sufrido. En el grupo lo que importa es ganar.'],
    draw: ['Empate. Un punto y a seguir.', 'Igualados. Reparto de puntos.', 'Empate trabado. Suma, pero poco.'],
    loss: ['Tropezón en el grupo. A recuperarse.', 'Derrota. Se complica el grupo.', 'Cayeron. Hay que reaccionar ya.'],
    loss_heavy: ['Baile en contra. El grupo, en rojo.', 'Goleada en contra. Mal momento.', 'Los pasaron por arriba. A levantarse.'],
    ko_rout: ['Goleada y a otra cosa.', 'Paliza. Ni se presentaron.', 'Festival. Sin discusión.'],
    ko_clear: ['Trámite resuelto.', 'Con autoridad, sin sustos.', 'Lo controlaron de punta a punta.'],
    ko_narrow: ['Sufrido, pero lo sacaron adelante.', 'Por un pelo, pero alcanzó.', 'Agónico. Aguantaron como leones.'],
    pens_win: ['¡Penales! Aguantaron los nervios.', 'Desde los doce pasos, heroicos.', 'Tanda dramática, y la metieron.'],
    group_must_win: ['Hay que ganar para seguir vivos.', 'Sin victoria, no hay mañana.', 'Final anticipada: o ganan, o afuera.'],
    out_g: ['Afuera en fase de grupos. Papelón.', 'Eliminados en la fase de grupos. Para el olvido.', 'Ni el grupo pudieron pasar. A revisar todo.'],
    out_r16: ['Eliminados en Octavos. Cortito el sueño.', 'Octavos y a casa. Esperabas más.'],
    out_qf: ['Cuartos y afuera. Faltó poco.', 'Eliminados en Cuartos. Tan cerca de la cima.'],
    out_sf: ['Tan cerca… Caíste en Semis. Te moriste en la orilla.', 'Semis. A un paso de la gloria, y nada.'],
    out_final: ['Subcampeón. Perdiste LA final. Duele como ninguna.', 'Tan cerca de todo… subcampeón. Qué bronca.'],
    champion: ['¡CAMPEÓN! Rey de Europa.', '¡La gloria es tuya! Campeón.', '¡Lo lograste! Campeón de Europa.'],
    scout_fav: ['Sos amplio favorito. No te relajes.', 'En los papeles, paliza tuya. A confirmarlo.'],
    scout_even: ['Mano a mano. Lo define un detalle.', 'Parejo de verdad. Cualquier cosa puede pasar.'],
    scout_dog: ['David contra Goliat. A dar el batacazo.', 'Te tocó un monstruo. A meterla toda.'],
  },
  en: {
    win_rout: ['Thrashing! Three points and a party.', 'Big win. Group on track.', 'Goal fest. Three points banked.', 'Steamrolled them. Huge points.'],
    win_clear: ['Clear win. Three points pocketed.', 'Solid victory for the group.', 'Won well, three points.'],
    win_narrow: ['Won the hard way, but three points.', 'Barely, but the three points stay.', 'Scrappy. In the group, winning is all.'],
    draw: ['Draw. A point and on we go.', 'All square. Points shared.', 'Tight draw. Something, not much.'],
    loss: ['Slip-up in the group. Regroup.', 'Defeat. The group gets tricky.', 'Lost it. React now.'],
    loss_heavy: ['Hammered. Group in the red.', 'Heavy loss. Bad spell.', 'Steamrolled. Pick it up.'],
    ko_rout: ['Thrashing, on to the next.', 'Demolition. They never showed up.', 'Goal fest. No debate.'],
    ko_clear: ['Job done.', 'In control, no scares.', 'Bossed it end to end.'],
    ko_narrow: ['Hard-fought, but through.', 'By a whisker, but enough.', 'Nail-biter. Held on heroically.'],
    pens_win: ['Penalties! Nerves of steel.', 'From the spot, heroic.', 'Dramatic shootout, and through.'],
    group_must_win: ['Win or go home.', 'No win, no tomorrow.', 'Do-or-die: win or out.'],
    out_g: ['Out in the group stage. Embarrassing.', 'Eliminated in the group. Forgettable.', 'Couldn’t clear the group. Rethink it all.'],
    out_r16: ['Out in the Round of 16. Short dream.', 'Round of 16 and home. Expected more.'],
    out_qf: ['Quarters and out. So close.', 'Eliminated in the Quarters. So near the top.'],
    out_sf: ['So close… Out in the Semis. Heartbreak on the doorstep.', 'Semis. One step from glory, nothing.'],
    out_final: ['Runner-up. Lost THE final. Hurts like no other.', 'So close to it all… runner-up. Brutal.'],
    champion: ['CHAMPION! King of Europe.', 'The glory is yours! Champion.', 'You did it! Champion of Europe.'],
    scout_fav: ['You’re the clear favourite. Don’t relax.', 'On paper, a rout for you. Go prove it.'],
    scout_even: ['Toss-up. A detail decides it.', 'Dead even. Anything can happen.'],
    scout_dog: ['David vs Goliath. Pull off the upset.', 'You drew a monster. Throw everything at it.'],
  },
  pt: {},
  fr: {},
};

/* Deterministic pick: same n → same variant. Falls back to 'es' if a locale
   hasn't been translated yet. */
export function flavor(cat: Cat, n: number, locale: Locale = 'es'): string {
  const arr = DICT[locale]?.[cat] ?? DICT.es[cat]!;
  return arr[(n >>> 0) % arr.length];
}