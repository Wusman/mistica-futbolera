/* ══════════════════════════════════════════
   MESSAGES — messages.ts
   Frases de veredicto. Selección determinista (sin Math.random).
   'es' rioplatense; 'en' en registro futbolero británico (localizado, no
   traducido literal). 'pt'/'fr' caen a 'es' hasta traducirlos.
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
    win_rout: ['Battered them! Three points and a party.', 'Goal fest. The group’s looking rosy.', 'Ran riot. Massive three points.', 'Swept them aside. Statement win.'],
    win_clear: ['Comfortable. Three points banked.', 'Won it well. Group on track.', 'Controlled from start to finish.'],
    win_narrow: ['Ugly, but it’s three points.', 'Over the line by a whisker.', 'Squeaky-bum stuff — but winning is all that matters.'],
    draw: ['A point apiece. On we go.', 'All square. Honours even.', 'Cagey draw. Something, not much.'],
    loss: ['A slip-up. Time to regroup.', 'Beaten. The group just got nervy.', 'Lost it. React, now.'],
    loss_heavy: ['Taken apart. Group in the red.', 'A proper hiding. Dark day.', 'Steamrolled. Pick yourselves up.'],
    ko_rout: ['Demolition job. Next.', 'They never showed up. A stroll.', 'Ruthless. No arguments.'],
    ko_clear: ['Job done.', 'In control, no scares.', 'Bossed it from first whistle to last.'],
    ko_narrow: ['Dug it out the hard way.', 'Through by the skin of your teeth.', 'Heroic. Hung on for dear life.'],
    pens_win: ['Nerves of steel from twelve yards.', 'Shootout drama — and you held your nerve.', 'Spot-kick heroes.'],
    group_must_win: ['Win or go home.', 'No win, no tomorrow.', 'A cup final already: win or you’re out.'],
    out_g: ['Out in the groups. Embarrassing.', 'Didn’t even clear the group. Back to the drawing board.', 'Group-stage exit. One to forget.'],
    out_r16: ['Out in the last 16. Short-lived dream.', 'Last 16 and home. You expected more.'],
    out_qf: ['Quarters and out. So close.', 'Knocked out in the quarters. Touching distance.'],
    out_sf: ['Heartbreak in the semis. So near, so far.', 'One step from glory — and nothing.'],
    out_final: ['Runners-up. Losing THE final hurts like nothing else.', 'So close to everything… second best. Brutal.'],
    champion: ['CHAMPIONS! Kings of Europe.', 'Glory is yours. Champions!', 'You’ve done it. Champions of Europe!'],
    scout_fav: ['You’re heavy favourites. Don’t switch off.', 'On paper it’s a stroll. Go prove it.'],
    scout_even: ['A coin flip. One detail decides it.', 'Dead even. Anything can happen.'],
    scout_dog: ['David vs Goliath. Go shock them.', 'You’ve drawn a monster. Empty the tank.'],
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