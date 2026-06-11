/* ══════════════════════════════════════════
   MESSAGES — messages.ts
   Frases de veredicto. Selección determinista (sin Math.random).
   Registro por idioma (localizado, no traducido literal):
   es = español neutro con sabor a prensa deportiva española;
   en = futbolero británico; pt = neutro con base BR; fr = informal francés.
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
    win_rout: ['¡Baño de fútbol! Tres puntos y fiesta.', 'Goleada. El grupo, bien encaminado.', 'Festival de goles. Suman de tres en tres.', 'Pasaron por encima. Triunfo enorme.'],
    win_clear: ['Triunfo claro. Tres puntos al bolsillo.', 'Victoria sólida para el grupo.', 'Ganaron bien y suman de a tres.'],
    win_narrow: ['Ganaron sufriendo, pero son tres puntos.', 'Por la mínima, pero los tres puntos se quedan.', 'Sufrido. En el grupo lo que importa es ganar.'],
    draw: ['Empate. Un punto y a seguir.', 'Igualados. Reparto de puntos.', 'Empate trabado. Suma, pero poco.'],
    loss: ['Tropiezo en el grupo. Toca recuperarse.', 'Derrota. Se complica el grupo.', 'Cayeron. Hay que reaccionar ya.'],
    loss_heavy: ['Repaso en contra. El grupo, en rojo.', 'Goleada en contra. Mal momento.', 'Los pasaron por encima. A levantarse.'],
    ko_rout: ['Goleada y a otra cosa.', 'Paliza. Ni se presentaron.', 'Festival. Sin discusión.'],
    ko_clear: ['Trámite resuelto.', 'Con autoridad, sin sustos.', 'Lo controlaron de principio a fin.'],
    ko_narrow: ['Sufrido, pero lo sacaron adelante.', 'Por un pelo, pero alcanzó.', 'Agónico. Aguantaron como leones.'],
    pens_win: ['¡Penaltis! Aguantaron los nervios.', 'Desde los once metros, heroicos.', 'Tanda dramática, y la ganaron.'],
    group_must_win: ['Hay que ganar para seguir vivos.', 'Sin victoria no hay mañana.', 'Final anticipada: o ganan, o fuera.'],
    out_g: ['Fuera en fase de grupos. Un desastre.', 'Eliminados en grupos. Para el olvido.', 'Ni el grupo pudieron pasar. A revisarlo todo.'],
    out_r16: ['Eliminados en Octavos. Corto el sueño.', 'Octavos y a casa. Esperabas más.'],
    out_qf: ['Cuartos y fuera. Faltó poco.', 'Eliminados en Cuartos. Tan cerca de la cima.'],
    out_sf: ['Tan cerca… Caíste en Semis. A las puertas de la final.', 'Semis. A un paso de la gloria, y nada.'],
    out_final: ['Subcampeón. Perdiste LA final. Duele como ninguna.', 'Tan cerca de todo… subcampeón. Qué rabia.'],
    champion: ['¡CAMPEÓN! Rey de Europa.', '¡La gloria es tuya! Campeón.', '¡Lo lograste! Campeón de Europa.'],
    scout_fav: ['Eres amplio favorito. No te relajes.', 'Sobre el papel, paseo tuyo. A confirmarlo.'],
    scout_even: ['Cara o cruz. Lo decide un detalle.', 'Igualado de verdad. Puede pasar cualquier cosa.'],
    scout_dog: ['David contra Goliat. A dar la campanada.', 'Te ha tocado un monstruo. A dejarlo todo.'],
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
  pt: {
    win_rout: ['Atropelo! Três pontos e festa.', 'Goleada. O grupo vai bem encaminhado.', 'Festival de gols. Somando de três em três.', 'Passaram por cima. Vitória enorme.'],
    win_clear: ['Vitória tranquila. Três pontos no bolso.', 'Vitória sólida para o grupo.', 'Ganharam bem e somam três.'],
    win_narrow: ['Sofrido, mas são três pontos.', 'No detalhe, mas os três pontos ficam.', 'Suado. No grupo, o que importa é vencer.'],
    draw: ['Empate. Um ponto e seguimos.', 'Igualdade. Pontos divididos.', 'Empate truncado. Soma, mas pouco.'],
    loss: ['Tropeço no grupo. Hora de reagir.', 'Derrota. O grupo complicou.', 'Caíram. Tem que responder já.'],
    loss_heavy: ['Atropelados. O grupo no vermelho.', 'Goleada sofrida. Momento ruim.', 'Passaram por cima. Hora de levantar.'],
    ko_rout: ['Goleada e próximo.', 'Nem apareceram. Passeio.', 'Implacável. Sem discussão.'],
    ko_clear: ['Missão cumprida.', 'Com autoridade, sem sustos.', 'Controlaram do início ao fim.'],
    ko_narrow: ['Sofrido, mas passaram.', 'Por um triz, mas deu.', 'Agônico. Seguraram como leões.'],
    pens_win: ['Pênaltis! Nervos de aço.', 'Da marca da cal, heróis.', 'Disputa dramática — e venceram.'],
    group_must_win: ['Tem que vencer para seguir vivo.', 'Sem vitória, não há amanhã.', 'Final antecipada: vence ou está fora.'],
    out_g: ['Fora na fase de grupos. Vexame.', 'Eliminados nos grupos. Para esquecer.', 'Nem o grupo passaram. Rever tudo.'],
    out_r16: ['Eliminados nas Oitavas. Sonho curto.', 'Oitavas e para casa. Você esperava mais.'],
    out_qf: ['Quartas e fora. Faltou pouco.', 'Eliminados nas Quartas. Tão perto do topo.'],
    out_sf: ['Tão perto… Caiu na Semi. Morreu na praia.', 'Semi. A um passo da glória, e nada.'],
    out_final: ['Vice. Perder A final dói como nenhuma outra.', 'Tão perto de tudo… vice-campeão. Que raiva.'],
    champion: ['CAMPEÃO! Rei da Europa.', 'A glória é sua! Campeão.', 'Conseguiu! Campeão da Europa.'],
    scout_fav: ['Você é o grande favorito. Não relaxe.', 'No papel, é passeio. Vai lá confirmar.'],
    scout_even: ['Cara ou coroa. Um detalhe decide.', 'Parelho de verdade. Tudo pode acontecer.'],
    scout_dog: ['Davi contra Golias. Vai dar o azar deles.', 'Pegou um monstro. Deixa tudo em campo.'],
  },
  fr: {
    win_rout: ['Démonstration ! Trois points et la fête.', 'Carton plein. Le groupe est bien lancé.', 'Festival de buts. Trois points de plus.', 'Ils les ont écrasés. Victoire énorme.'],
    win_clear: ['Victoire nette. Trois points dans la poche.', 'Succès solide pour le groupe.', 'Bien gagné, trois points de plus.'],
    win_narrow: ['Dans la douleur, mais ça fait trois points.', 'Sur le fil, mais les trois points restent.', 'Arraché. En poules, seule la victoire compte.'],
    draw: ['Match nul. Un point et on avance.', 'Égalité. Les points sont partagés.', 'Nul fermé. Ça compte, mais à peine.'],
    loss: ['Faux pas dans le groupe. Il faut réagir.', 'Défaite. Le groupe se complique.', 'Battus. Réaction obligatoire.'],
    loss_heavy: ['Corrigés. Le groupe dans le rouge.', 'Lourde défaite. Sale moment.', 'Ils sont passés dessus. Il faut se relever.'],
    ko_rout: ['Démolition. Au suivant.', 'Ils n’ont jamais existé. Promenade.', 'Implacable. Sans discussion.'],
    ko_clear: ['Mission accomplie.', 'Avec autorité, sans frayeur.', 'Maîtrisé de bout en bout.'],
    ko_narrow: ['Arraché dans la douleur.', 'Qualifiés d’un cheveu.', 'Héroïque. Ils ont tenu bon.'],
    pens_win: ['Tirs au but ! Nerfs d’acier.', 'Au point de penalty, des héros.', 'Séance dramatique — et c’est gagné.'],
    group_must_win: ['Gagner ou rentrer à la maison.', 'Sans victoire, pas de lendemain.', 'Déjà une finale : gagner ou sortir.'],
    out_g: ['Éliminés en poules. La honte.', 'Sortis dès les poules. À oublier.', 'Même pas passé les poules. Tout est à revoir.'],
    out_r16: ['Éliminés en 8es. Rêve trop court.', '8es et retour maison. Tu attendais mieux.'],
    out_qf: ['Quarts et dehors. Il a manqué peu.', 'Éliminés en quarts. Si près du sommet.'],
    out_sf: ['Si près… Tombés en demies. Échoués au port.', 'Demies. À un pas de la gloire, et rien.'],
    out_final: ['Finaliste. Perdre LA finale, rien ne fait plus mal.', 'Si près de tout… vice-champion. Quelle rage.'],
    champion: ['CHAMPION ! Roi de l’Europe.', 'La gloire est à toi ! Champion.', 'Tu l’as fait ! Champion d’Europe.'],
    scout_fav: ['Tu es l’immense favori. Ne te relâche pas.', 'Sur le papier, promenade. À confirmer.'],
    scout_even: ['Pile ou face. Un détail décidera.', 'Vraiment équilibré. Tout peut arriver.'],
    scout_dog: ['David contre Goliath. Va créer l’exploit.', 'Tu as tiré un monstre. Donne tout.'],
  },
};

/* Variante determinista: (categoría, índice derivado del estado del partido,
   idioma) → siempre la misma frase. Cae a 'es' si falta la categoría. */
export function flavor(cat: Cat, n: number, locale: Locale = 'es'): string {
  const arr = DICT[locale]?.[cat] ?? DICT.es[cat] ?? [];
  if (arr.length === 0) return '';
  return arr[Math.abs(n) % arr.length];
}