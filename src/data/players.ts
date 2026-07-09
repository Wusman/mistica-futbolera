/* ══════════════════════════════════════════
   DATA — players.ts  (v3: glorias de Europa, 1993–2025)

   Single source of game data: champion squads + formations.

   POSITIONS: fine positions, 1–2 per player (natural first). A player
   is eligible for a slot only if the slot's position is in `pos`
   (strict, no penalty — the dual position is the flexibility).

   TEAMS: 19 champions + 11 mythical finalists (1993–2025), picked for
   global name-recognition. Squad membership is from the well-known
   finals/runs; fine-position tags and ratings are a first, editable pass.
   Non-champions sit in a deliberately lower rating band: beatable group
   rivals + a less broken draft pool. Inter-team variance is intentional.

   IDENTITY: each team carries 1–3 own brand COLORS (no crests/kits).
══════════════════════════════════════════ */

export type Pos =
  | 'GK'
  | 'RB' | 'CB' | 'LB'
  | 'DM' | 'CM' | 'AM' | 'RM' | 'LM'
  | 'RW' | 'LW' | 'ST';

/* IMPORT TYPE a nivel sentencia, NO `import { type ... }`: con
   verbatimModuleSyntax el inline deja un import de efecto y crea un CICLO
   runtime players↔escudo que revienta el init (pantalla en negro). */
import type { Pattern } from '../lib/escudo';

export interface Player {
  i: number;
  n: string;
  pos: Pos[];
  r: number;
}

export interface Team {
  id: string;
  name: string;
  edition: string;
  colors: string[]; // 1–3 OWN brand colors (not official crests/kits)
  /* Patrón del emblema genérico que EVOCA la camiseta histórica (geometría
     genérica: rayas/banda/diagonal — jamás el escudo o la marca reales).
     Ausente → hash determinista de los colores (teamPattern). */
  pattern?: Pattern;
  players: Player[];
}

export interface Slot {
  pos: Pos;
  x: number;
  y: number;
}

/* Ordered slot layouts with pitch coordinates (x,y in %). */
export const FORMATIONS = {
  '4-3-3': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 14, y: 70 }, { pos: 'CB', x: 38, y: 76 }, { pos: 'CB', x: 62, y: 76 }, { pos: 'RB', x: 86, y: 70 },
    { pos: 'CM', x: 30, y: 50 }, { pos: 'CM', x: 50, y: 56 }, { pos: 'CM', x: 70, y: 50 },
    { pos: 'LW', x: 20, y: 26 }, { pos: 'ST', x: 50, y: 20 }, { pos: 'RW', x: 80, y: 26 },
  ] },
  '4-4-2': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 14, y: 72 }, { pos: 'CB', x: 38, y: 76 }, { pos: 'CB', x: 62, y: 76 }, { pos: 'RB', x: 86, y: 72 },
    { pos: 'LM', x: 16, y: 48 }, { pos: 'CM', x: 38, y: 52 }, { pos: 'CM', x: 62, y: 52 }, { pos: 'RM', x: 84, y: 48 },
    { pos: 'ST', x: 38, y: 22 }, { pos: 'ST', x: 62, y: 22 },
  ] },
  '4-2-3-1': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 14, y: 72 }, { pos: 'CB', x: 38, y: 76 }, { pos: 'CB', x: 62, y: 76 }, { pos: 'RB', x: 86, y: 72 },
    { pos: 'CM', x: 36, y: 58 }, { pos: 'CM', x: 64, y: 58 },
    { pos: 'LW', x: 18, y: 34 }, { pos: 'AM', x: 50, y: 40 }, { pos: 'RW', x: 82, y: 34 },
    { pos: 'ST', x: 50, y: 18 },
  ] },
  '3-5-2': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'CB', x: 28, y: 76 }, { pos: 'CB', x: 50, y: 78 }, { pos: 'CB', x: 72, y: 76 },
    { pos: 'LM', x: 12, y: 52 }, { pos: 'CM', x: 35, y: 54 }, { pos: 'CM', x: 50, y: 58 }, { pos: 'CM', x: 65, y: 54 }, { pos: 'RM', x: 88, y: 52 },
    { pos: 'ST', x: 38, y: 22 }, { pos: 'ST', x: 62, y: 22 },
  ] },
  '5-3-2': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 10, y: 68 }, { pos: 'CB', x: 30, y: 78 }, { pos: 'CB', x: 50, y: 80 }, { pos: 'CB', x: 70, y: 78 }, { pos: 'RB', x: 90, y: 68 },
    { pos: 'CM', x: 30, y: 52 }, { pos: 'CM', x: 50, y: 54 }, { pos: 'CM', x: 70, y: 52 },
    { pos: 'ST', x: 38, y: 24 }, { pos: 'ST', x: 62, y: 24 },
  ] },
  '3-4-3': { slots: [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'CB', x: 28, y: 76 }, { pos: 'CB', x: 50, y: 78 }, { pos: 'CB', x: 72, y: 76 },
    { pos: 'LM', x: 14, y: 52 }, { pos: 'CM', x: 38, y: 54 }, { pos: 'CM', x: 62, y: 54 }, { pos: 'RM', x: 86, y: 52 },
    { pos: 'LW', x: 20, y: 24 }, { pos: 'ST', x: 50, y: 20 }, { pos: 'RW', x: 80, y: 24 },
  ] },
} as const;

export type FormationName = keyof typeof FORMATIONS;

export const TEAMS: Team[] = [
  /* ── Real Madrid · Champions 2022 ── Ancelotti; Benzema's Ballon d'Or run; beat Liverpool. */
  {
    id: 'rma22', name: 'Real Madrid', edition: 'Champions 2022', colors: ['#e9e9e9', '#1d2b6b', '#c8a24a'], pattern: 'solid',
    players: [
      { i: 100, n: 'Thibaut Courtois',   pos: ['GK'],       r: 90 }, // MOTM in the final
      { i: 101, n: 'Dani Carvajal',      pos: ['RB'],       r: 84 },
      { i: 102, n: 'Éder Militão',       pos: ['CB'],       r: 85 },
      { i: 103, n: 'David Alaba',        pos: ['CB', 'LB'], r: 86 },
      { i: 104, n: 'Ferland Mendy',      pos: ['LB'],       r: 82 },
      { i: 105, n: 'Casemiro',           pos: ['DM'],       r: 88 },
      { i: 106, n: 'Luka Modrić',        pos: ['CM', 'AM'], r: 90 },
      { i: 107, n: 'Toni Kroos',         pos: ['CM', 'DM'], r: 89 },
      { i: 108, n: 'Federico Valverde',  pos: ['CM', 'RM'], r: 85 },
      { i: 109, n: 'Karim Benzema',      pos: ['ST'],       r: 93 }, // Ballon d'Or 2022
      { i: 110, n: 'Vinícius Júnior',    pos: ['LW'],       r: 89 }, // scored the winner
      { i: 111, n: 'Rodrygo',            pos: ['RW', 'ST'], r: 84 }, // the comeback super-sub
    ],
  },

  /* ── Barcelona · Champions 2011 ── Guardiola's peak; beat Man United at Wembley. */
  {
    id: 'bar11', name: 'Barcelona', edition: 'Champions 2011', colors: ['#a50044', '#004d98', '#edbb00'], pattern: 'vstripe',
    players: [
      { i: 200, n: 'Víctor Valdés',     pos: ['GK'],             r: 85 },
      { i: 201, n: 'Dani Alves',        pos: ['RB'],             r: 87 },
      { i: 202, n: 'Gerard Piqué',      pos: ['CB'],             r: 87 },
      { i: 203, n: 'Javier Mascherano', pos: ['CB', 'DM'],       r: 84 },
      { i: 204, n: 'Éric Abidal',       pos: ['LB', 'CB'],       r: 83 },
      { i: 205, n: 'Carles Puyol',      pos: ['CB'],             r: 86 }, // captain
      { i: 206, n: 'Sergio Busquets',   pos: ['DM'],             r: 88 },
      { i: 207, n: 'Xavi',              pos: ['CM'],             r: 92 },
      { i: 208, n: 'Andrés Iniesta',    pos: ['AM', 'CM'],       r: 93 },
      { i: 209, n: 'Pedro',             pos: ['RW', 'LW'],       r: 83 },
      { i: 210, n: 'David Villa',       pos: ['ST', 'LW'],       r: 88 },
      { i: 211, n: 'Lionel Messi',      pos: ['RW', 'AM', 'ST'], r: 99 }, // top scorer, the GOAT
    ],
  },

  /* ── Bayern München · Champions 2020 ── Flick's treble; 11 wins from 11; beat PSG. */
  {
    id: 'fcb20', name: 'Bayern München', edition: 'Champions 2020', colors: ['#dc052d', '#0066b2'], pattern: 'solid',
    players: [
      { i: 300, n: 'Manuel Neuer',       pos: ['GK'],       r: 90 },
      { i: 301, n: 'Joshua Kimmich',     pos: ['RB', 'DM'], r: 88 },
      { i: 302, n: 'Jérôme Boateng',     pos: ['CB'],       r: 84 },
      { i: 303, n: 'David Alaba',        pos: ['CB', 'LB'], r: 85 },
      { i: 304, n: 'Alphonso Davies',    pos: ['LB'],       r: 84 },
      { i: 305, n: 'Leon Goretzka',      pos: ['CM'],       r: 84 },
      { i: 306, n: 'Thiago Alcântara',   pos: ['CM', 'DM'], r: 87 },
      { i: 307, n: 'Serge Gnabry',       pos: ['RW', 'LW'], r: 85 },
      { i: 308, n: 'Thomas Müller',      pos: ['AM', 'RW'], r: 87 },
      { i: 309, n: 'Kingsley Coman',     pos: ['LW', 'RW'], r: 84 }, // scored the winner
      { i: 310, n: 'Robert Lewandowski', pos: ['ST'],       r: 92 }, // 15 goals that run
      { i: 311, n: 'Ivan Perišić',       pos: ['LW', 'LM'], r: 81 },
    ],
  },

  /* ── Liverpool · Champions 2019 ── Klopp; beat Tottenham in Madrid. */
  {
    id: 'liv19', name: 'Liverpool', edition: 'Champions 2019', colors: ['#c8102e', '#f6eb61'], pattern: 'solid',
    players: [
      { i: 400, n: 'Alisson',                pos: ['GK'],       r: 89 },
      { i: 401, n: 'Trent Alexander-Arnold', pos: ['RB'],       r: 85 },
      { i: 402, n: 'Joël Matip',             pos: ['CB'],       r: 81 },
      { i: 403, n: 'Virgil van Dijk',        pos: ['CB'],       r: 91 },
      { i: 404, n: 'Andrew Robertson',       pos: ['LB'],       r: 85 },
      { i: 405, n: 'Fabinho',                pos: ['DM'],       r: 85 },
      { i: 406, n: 'Jordan Henderson',       pos: ['CM'],       r: 83 },
      { i: 407, n: 'Georginio Wijnaldum',    pos: ['CM', 'AM'], r: 83 },
      { i: 408, n: 'Mohamed Salah',          pos: ['RW', 'ST'], r: 91 },
      { i: 409, n: 'Roberto Firmino',        pos: ['ST', 'AM'], r: 86 },
      { i: 410, n: 'Sadio Mané',             pos: ['LW', 'ST'], r: 88 },
      { i: 411, n: 'Divock Origi',           pos: ['ST'],       r: 78 }, // the semifinal hero
    ],
  },

  /* ── Manchester City · Champions 2023 ── Guardiola's treble; beat Inter. */
  {
    id: 'mci23', name: 'Manchester City', edition: 'Champions 2023', colors: ['#6cabdd', '#1c2c5b'], pattern: 'solid',
    players: [
      { i: 500, n: 'Ederson',           pos: ['GK'],       r: 88 },
      { i: 501, n: 'Kyle Walker',       pos: ['RB'],       r: 84 },
      { i: 502, n: 'John Stones',       pos: ['CB', 'DM'], r: 84 },
      { i: 503, n: 'Rúben Dias',        pos: ['CB'],       r: 87 },
      { i: 504, n: 'Manuel Akanji',     pos: ['CB', 'RB'], r: 82 },
      { i: 505, n: 'Rodri',             pos: ['DM', 'CM'], r: 89 }, // scored the winner
      { i: 506, n: 'Kevin De Bruyne',   pos: ['AM', 'CM'], r: 92 },
      { i: 507, n: 'İlkay Gündoğan',    pos: ['CM', 'AM'], r: 86 }, // captain
      { i: 508, n: 'Bernardo Silva',    pos: ['RW', 'AM'], r: 87 },
      { i: 509, n: 'Erling Haaland',    pos: ['ST'],       r: 93 }, // 12 goals that run
      { i: 510, n: 'Jack Grealish',     pos: ['LW'],       r: 84 },
      { i: 511, n: 'Phil Foden',        pos: ['AM', 'LW'], r: 85 },
    ],
  },

  /* ── Inter · Champions 2010 ── Mourinho's treble; beat Bayern in Madrid. */
  {
    id: 'int10', name: 'Inter', edition: 'Champions 2010', colors: ['#0a0a0a', '#1f4fb6'], pattern: 'vstripe',
    players: [
      { i: 600, n: 'Júlio César',        pos: ['GK'],       r: 87 },
      { i: 601, n: 'Maicon',             pos: ['RB'],       r: 86 },
      { i: 602, n: 'Lúcio',              pos: ['CB'],       r: 85 },
      { i: 603, n: 'Walter Samuel',      pos: ['CB'],       r: 85 },
      { i: 604, n: 'Cristian Chivu',     pos: ['LB', 'CB'], r: 80 },
      { i: 605, n: 'Javier Zanetti',     pos: ['RB', 'CM'], r: 88 }, // captain, plays anywhere
      { i: 606, n: 'Esteban Cambiasso',  pos: ['DM', 'CM'], r: 86 },
      { i: 607, n: 'Dejan Stanković',    pos: ['CM', 'AM'], r: 83 },
      { i: 608, n: 'Wesley Sneijder',    pos: ['AM'],       r: 90 },
      { i: 609, n: 'Goran Pandev',       pos: ['LW', 'ST'], r: 80 },
      { i: 610, n: 'Samuel Eto\'o',      pos: ['ST', 'RW'], r: 90 },
      { i: 611, n: 'Diego Milito',       pos: ['ST'],       r: 88 }, // brace in the final
    ],
  },

  /* ── AC Milan · Champions 2007 ── Ancelotti; Kaká's year; beat Liverpool (revenge of 2005). */
  {
    id: 'acm07', name: 'AC Milan', edition: 'Champions 2007', colors: ['#fb090b', '#0a0a0a'], pattern: 'vstripe',
    players: [
      { i: 700, n: 'Dida',                pos: ['GK'],       r: 84 },
      { i: 701, n: 'Massimo Oddo',        pos: ['RB'],       r: 80 },
      { i: 702, n: 'Alessandro Nesta',    pos: ['CB'],       r: 90 },
      { i: 703, n: 'Paolo Maldini',       pos: ['CB', 'LB'], r: 90 }, // captain
      { i: 704, n: 'Marek Jankulovski',   pos: ['LB'],       r: 79 },
      { i: 705, n: 'Gennaro Gattuso',     pos: ['DM'],       r: 84 },
      { i: 706, n: 'Andrea Pirlo',        pos: ['DM', 'CM'], r: 91 },
      { i: 707, n: 'Massimo Ambrosini',   pos: ['CM'],       r: 80 },
      { i: 708, n: 'Clarence Seedorf',    pos: ['CM', 'AM'], r: 86 },
      { i: 709, n: 'Kaká',                pos: ['AM'],       r: 94 }, // Ballon d'Or 2007, top scorer
      { i: 710, n: 'Filippo Inzaghi',     pos: ['ST'],       r: 86 }, // brace in the final
      { i: 711, n: 'Alberto Gilardino',   pos: ['ST'],       r: 80 },
    ],
  },

/* ── Real Madrid · Champions 2014 ── "La Décima"; Bale + BBC; beat Atlético. */
  {
    id: 'rma14', name: 'Real Madrid', edition: 'Champions 2014', colors: ['#e9e9e9', '#1d2b6b', '#c8a24a'], pattern: 'solid',
    players: [
      { i: 900, n: 'Iker Casillas',     pos: ['GK'],             r: 85 },
      { i: 901, n: 'Dani Carvajal',     pos: ['RB'],             r: 82 },
      { i: 902, n: 'Sergio Ramos',      pos: ['CB'],             r: 89 }, // the 92:48 header
      { i: 903, n: 'Pepe',              pos: ['CB'],             r: 84 },
      { i: 904, n: 'Marcelo',           pos: ['LB'],             r: 86 },
      { i: 905, n: 'Xabi Alonso',       pos: ['DM', 'CM'],       r: 86 },
      { i: 906, n: 'Luka Modrić',       pos: ['CM', 'AM'],       r: 88 },
      { i: 907, n: 'Ángel Di María',    pos: ['CM', 'LW'],       r: 87 },
      { i: 908, n: 'Gareth Bale',       pos: ['RW', 'ST'],       r: 88 },
      { i: 909, n: 'Karim Benzema',     pos: ['ST'],             r: 87 },
      { i: 910, n: 'Cristiano Ronaldo', pos: ['LW', 'ST'],       r: 97 },
      { i: 911, n: 'Isco',              pos: ['AM', 'CM'],       r: 83 },
    ],
  },

  /* ── Barcelona · Champions 2015 ── the MSN; Luis Enrique; beat Juventus. */
  {
    id: 'bar15', name: 'Barcelona', edition: 'Champions 2015', colors: ['#a50044', '#004d98', '#edbb00'], pattern: 'vstripe',
    players: [
      { i: 1000, n: 'Marc-André ter Stegen', pos: ['GK'],             r: 86 },
      { i: 1001, n: 'Dani Alves',            pos: ['RB'],             r: 85 },
      { i: 1002, n: 'Gerard Piqué',          pos: ['CB'],             r: 86 },
      { i: 1003, n: 'Javier Mascherano',     pos: ['CB', 'DM'],       r: 83 },
      { i: 1004, n: 'Jordi Alba',            pos: ['LB'],             r: 85 },
      { i: 1005, n: 'Sergio Busquets',       pos: ['DM'],             r: 87 },
      { i: 1006, n: 'Ivan Rakitić',          pos: ['CM'],             r: 84 },
      { i: 1007, n: 'Andrés Iniesta',        pos: ['AM', 'CM'],       r: 90 },
      { i: 1008, n: 'Lionel Messi',          pos: ['RW', 'AM'],       r: 99 },
      { i: 1009, n: 'Luis Suárez',           pos: ['ST'],             r: 91 },
      { i: 1010, n: 'Neymar',                pos: ['LW', 'ST'],       r: 90 },
    ],
  },

  /* ── Porto · Champions 2004 ── Mourinho's surprise; Deco the star, the rest of-trade. */
  {
    id: 'por04', name: 'Porto', edition: 'Champions 2004', colors: ['#02488f', '#ffffff'], pattern: 'vstripe',
    players: [
      { i: 1100, n: 'Vítor Baía',        pos: ['GK'],       r: 80 },
      { i: 1101, n: 'Paulo Ferreira',    pos: ['RB'],       r: 79 },
      { i: 1102, n: 'Jorge Costa',       pos: ['CB'],       r: 80 },
      { i: 1103, n: 'Ricardo Carvalho',  pos: ['CB'],       r: 85 },
      { i: 1104, n: 'Nuno Valente',      pos: ['LB'],       r: 77 },
      { i: 1105, n: 'Costinha',          pos: ['DM'],       r: 80 },
      { i: 1106, n: 'Maniche',           pos: ['CM', 'DM'], r: 83 },
      { i: 1107, n: 'Deco',              pos: ['AM'],       r: 88 }, // MOTM in the final
      { i: 1108, n: 'Pedro Mendes',      pos: ['CM'],       r: 77 },
      { i: 1109, n: 'Carlos Alberto',    pos: ['AM', 'ST'], r: 78 }, // scored in the final
      { i: 1110, n: 'Derlei',            pos: ['ST'],       r: 79 },
      { i: 1111, n: 'Benni McCarthy',    pos: ['ST'],       r: 80 },
    ],
  },

  /* ── Liverpool · Champions 2005 ── the Istanbul miracle; Gerrard carries a workmanlike side. */
  {
    id: 'liv05', name: 'Liverpool', edition: 'Champions 2005', colors: ['#c8102e', '#ffffff'], pattern: 'solid',
    players: [
      { i: 1200, n: 'Jerzy Dudek',       pos: ['GK'],       r: 78 }, // the spaghetti-legs saves
      { i: 1201, n: 'Steve Finnan',      pos: ['RB'],       r: 78 },
      { i: 1202, n: 'Jamie Carragher',   pos: ['CB'],       r: 82 },
      { i: 1203, n: 'Sami Hyypiä',       pos: ['CB'],       r: 81 },
      { i: 1204, n: 'Djimi Traoré',      pos: ['LB', 'CB'], r: 74 },
      { i: 1205, n: 'Steven Gerrard',    pos: ['CM', 'AM'], r: 89 }, // captain, dragged them back
      { i: 1206, n: 'Xabi Alonso',       pos: ['CM', 'DM'], r: 85 },
      { i: 1207, n: 'Dietmar Hamann',    pos: ['DM'],       r: 80 },
      { i: 1208, n: 'Luis García',       pos: ['AM', 'RW'], r: 80 },
      { i: 1209, n: 'John Arne Riise',   pos: ['LM', 'LB'], r: 79 },
      { i: 1210, n: 'Milan Baroš',       pos: ['ST'],       r: 78 },
      { i: 1211, n: 'Djibril Cissé',     pos: ['ST'],       r: 78 },
    ],
  },

  /* ── Chelsea · Champions 2012 ── Di Matteo; an aging, defiant machine; beat Bayern on pens. */
  {
    id: 'che12', name: 'Chelsea', edition: 'Champions 2012', colors: ['#034694', '#ffffff'], pattern: 'solid',
    players: [
      { i: 1300, n: 'Petr Čech',          pos: ['GK'],       r: 85 }, // shootout hero
      { i: 1301, n: 'Branislav Ivanović', pos: ['RB', 'CB'], r: 81 },
      { i: 1302, n: 'David Luiz',         pos: ['CB'],       r: 82 },
      { i: 1303, n: 'John Terry',         pos: ['CB'],       r: 84 }, // captain
      { i: 1304, n: 'Ashley Cole',        pos: ['LB'],       r: 84 },
      { i: 1305, n: 'John Obi Mikel',     pos: ['DM'],       r: 79 },
      { i: 1306, n: 'Frank Lampard',      pos: ['CM'],       r: 86 },
      { i: 1307, n: 'Ramires',            pos: ['CM', 'RM'], r: 80 },
      { i: 1308, n: 'Juan Mata',          pos: ['AM'],       r: 85 },
      { i: 1309, n: 'Salomon Kalou',      pos: ['RW', 'LW'], r: 78 },
      { i: 1310, n: 'Didier Drogba',      pos: ['ST'],       r: 86 }, // the equalizer + winning pen
      { i: 1311, n: 'Fernando Torres',    pos: ['ST'],       r: 80 },
    ],
  },

  /* ── Marseille · Champions 1993 ── first French winner; beat Milan. */
  {
    id: 'om93', name: 'Marseille', edition: 'Champions 1993', colors: ['#2faee0', '#ffffff'], pattern: 'solid',
    players: [
      { i: 1400, n: 'Fabien Barthez',     pos: ['GK'],       r: 80 },
      { i: 1401, n: 'Jocelyn Angloma',    pos: ['RB'],       r: 78 },
      { i: 1402, n: 'Basile Boli',        pos: ['CB'],       r: 80 }, // scored the winner
      { i: 1403, n: 'Marcel Desailly',    pos: ['CB', 'DM'], r: 84 },
      { i: 1404, n: 'Éric Di Meco',       pos: ['LB'],       r: 78 },
      { i: 1405, n: 'Didier Deschamps',   pos: ['DM', 'CM'], r: 83 }, // captain
      { i: 1406, n: 'Franck Sauzée',      pos: ['CM'],       r: 80 },
      { i: 1407, n: 'Jean-Jacques Eydelie', pos: ['CM'],     r: 75 },
      { i: 1408, n: 'Abedi Pelé',         pos: ['AM', 'LW'], r: 85 },
      { i: 1409, n: 'Rudi Völler',        pos: ['ST'],       r: 84 },
      { i: 1410, n: 'Alen Bokšić',        pos: ['ST'],       r: 81 },
    ],
  },

  /* ── Manchester United · Champions 2008 ── Ferguson; Ronaldo's year; beat Chelsea on pens. */
  {
    id: 'mun08', name: 'Manchester United', edition: 'Champions 2008', colors: ['#da020e', '#f5f5f5', '#0a0a0a'], pattern: 'solid',
    players: [
      { i: 800, n: 'Edwin van der Sar',  pos: ['GK'],       r: 85 },
      { i: 801, n: 'Wes Brown',          pos: ['RB', 'CB'], r: 79 },
      { i: 802, n: 'Rio Ferdinand',      pos: ['CB'],       r: 88 },
      { i: 803, n: 'Nemanja Vidić',      pos: ['CB'],       r: 88 },
      { i: 804, n: 'Patrice Evra',       pos: ['LB'],       r: 84 },
      { i: 805, n: 'Owen Hargreaves',    pos: ['CM', 'DM'], r: 82 },
      { i: 806, n: 'Michael Carrick',    pos: ['CM', 'DM'], r: 83 },
      { i: 807, n: 'Paul Scholes',       pos: ['CM', 'AM'], r: 88 },
      { i: 808, n: 'Ryan Giggs',         pos: ['LW', 'AM'], r: 85 },
      { i: 809, n: 'Cristiano Ronaldo',  pos: ['RW', 'ST'], r: 97 }, // top scorer, 42 goals that season
      { i: 810, n: 'Wayne Rooney',       pos: ['ST', 'AM'], r: 89 },
      { i: 811, n: 'Carlos Tévez',       pos: ['ST'],       r: 86 },
    ],
  },

  /* ════════════════════════════════════════
     DATASET v2 — finalistas y equipos míticos por recorrido (no campeones).
     Diseño: banda de ratings deliberadamente más baja que los campeones
     (estrellas 84–92, rol 74–83) → rivales "ganables" en grupos y un pool
     de draft menos roto. La varianza entre equipos es intencional.
  ════════════════════════════════════════ */

  /* ── Monaco · Finalista 2004 ── la sorpresa de Deschamps; eliminó a Real y Chelsea. */
  {
    id: 'mon04', name: 'Monaco', edition: 'Finalista 2004', colors: ['#e63b3b', '#ffffff'], pattern: 'diagonal',
    players: [
      { i: 1500, n: 'Flavio Roma',        pos: ['GK'],       r: 78 },
      { i: 1501, n: 'Hugo Ibarra',        pos: ['RB'],       r: 76 },
      { i: 1502, n: 'Gaël Givet',         pos: ['CB', 'LB'], r: 78 },
      { i: 1503, n: 'Sébastien Squillaci',pos: ['CB'],       r: 77 },
      { i: 1504, n: 'Patrice Evra',       pos: ['LB', 'LM'], r: 83 },
      { i: 1505, n: 'Akis Zikos',         pos: ['DM'],       r: 76 },
      { i: 1506, n: 'Lucas Bernardi',     pos: ['DM', 'CM'], r: 79 },
      { i: 1507, n: 'Édouard Cissé',      pos: ['CM'],       r: 75 },
      { i: 1508, n: 'Jérôme Rothen',      pos: ['LM', 'LW'], r: 82 },
      { i: 1509, n: 'Ludovic Giuly',      pos: ['RW', 'RM'], r: 84 }, // capitán
      { i: 1510, n: 'Fernando Morientes', pos: ['ST'],       r: 87 }, // goleador del torneo
      { i: 1511, n: 'Dado Pršo',          pos: ['ST'],       r: 80 },
    ],
  },

  /* ── Arsenal · Finalista 2006 ── récord defensivo en la corrida; con 10 casi la gana. */
  {
    id: 'ars06', name: 'Arsenal', edition: 'Finalista 2006', colors: ['#ef0107', '#c8a24a'], pattern: 'solid',
    players: [
      { i: 1600, n: 'Jens Lehmann',      pos: ['GK'],       r: 84 },
      { i: 1601, n: 'Emmanuel Eboué',    pos: ['RB'],       r: 78 },
      { i: 1602, n: 'Kolo Touré',        pos: ['CB'],       r: 84 },
      { i: 1603, n: 'Sol Campbell',      pos: ['CB'],       r: 84 }, // gol en la final
      { i: 1604, n: 'Ashley Cole',       pos: ['LB'],       r: 85 },
      { i: 1605, n: 'Gilberto Silva',    pos: ['DM'],       r: 83 },
      { i: 1606, n: 'Cesc Fàbregas',     pos: ['CM', 'AM'], r: 85 },
      { i: 1607, n: 'Alexander Hleb',    pos: ['AM', 'RM'], r: 81 },
      { i: 1608, n: 'Robert Pirès',      pos: ['RM', 'LW'], r: 85 },
      { i: 1609, n: 'Freddie Ljungberg', pos: ['RM', 'AM'], r: 82 },
      { i: 1610, n: 'Thierry Henry',     pos: ['ST', 'LW'], r: 92 }, // capitán, en su pico
      { i: 1611, n: 'José Antonio Reyes',pos: ['LW'],       r: 80 },
    ],
  },

  /* ── Borussia Dortmund · Finalista 2013 ── el Klopp del gegenpressing; Lewa 4 a Real. */
  {
    id: 'bvb13', name: 'Borussia Dortmund', edition: 'Finalista 2013', colors: ['#fde100', '#0a0a0a'], pattern: 'solid',
    players: [
      { i: 1700, n: 'Roman Weidenfeller',   pos: ['GK'],       r: 82 },
      { i: 1701, n: 'Łukasz Piszczek',      pos: ['RB'],       r: 82 },
      { i: 1702, n: 'Neven Subotić',        pos: ['CB'],       r: 81 },
      { i: 1703, n: 'Mats Hummels',         pos: ['CB'],       r: 86 },
      { i: 1704, n: 'Marcel Schmelzer',     pos: ['LB'],       r: 79 },
      { i: 1705, n: 'Sven Bender',          pos: ['DM'],       r: 80 },
      { i: 1706, n: 'İlkay Gündoğan',       pos: ['CM', 'DM'], r: 85 },
      { i: 1707, n: 'Jakub Błaszczykowski', pos: ['RM', 'RW'], r: 80 },
      { i: 1708, n: 'Kevin Großkreutz',     pos: ['LM', 'LB'], r: 77 },
      { i: 1709, n: 'Marco Reus',           pos: ['AM', 'LW'], r: 88 },
      { i: 1710, n: 'Mario Götze',          pos: ['AM', 'RW'], r: 85 },
      { i: 1711, n: 'Robert Lewandowski',   pos: ['ST'],       r: 91 }, // póker a Real en semis
    ],
  },

  /* ── Atlético Madrid · Finalista 2014 ── el Cholismo; lo perdió en el 92:48. */
  {
    id: 'atm14', name: 'Atlético Madrid', edition: 'Finalista 2014', colors: ['#cb3524', '#ffffff', '#1b3d8f'], pattern: 'vstripe',
    players: [
      { i: 1800, n: 'Thibaut Courtois', pos: ['GK'],       r: 86 },
      { i: 1801, n: 'Juanfran',         pos: ['RB'],       r: 81 },
      { i: 1802, n: 'Miranda',          pos: ['CB'],       r: 83 },
      { i: 1803, n: 'Diego Godín',      pos: ['CB'],       r: 86 }, // gol en la final
      { i: 1804, n: 'Filipe Luís',      pos: ['LB'],       r: 83 },
      { i: 1805, n: 'Gabi',             pos: ['CM', 'DM'], r: 82 }, // capitán
      { i: 1806, n: 'Tiago',            pos: ['DM', 'CM'], r: 79 },
      { i: 1807, n: 'Koke',             pos: ['CM', 'RM'], r: 84 },
      { i: 1808, n: 'Arda Turan',       pos: ['RM', 'AM'], r: 84 },
      { i: 1809, n: 'Raúl García',      pos: ['AM', 'ST'], r: 79 },
      { i: 1810, n: 'Diego Costa',      pos: ['ST'],       r: 87 },
      { i: 1811, n: 'David Villa',      pos: ['ST', 'LW'], r: 83 },
    ],
  },

  /* ── Atlético Madrid · Finalista 2016 ── otra final al límite; cayó por penales. */
  {
    id: 'atm16', name: 'Atlético Madrid', edition: 'Finalista 2016', colors: ['#cb3524', '#ffffff', '#1b3d8f'], pattern: 'vstripe',
    players: [
      { i: 1900, n: 'Jan Oblak',         pos: ['GK'],       r: 88 },
      { i: 1901, n: 'Juanfran',          pos: ['RB'],       r: 80 },
      { i: 1902, n: 'Stefan Savić',      pos: ['CB'],       r: 81 },
      { i: 1903, n: 'Diego Godín',       pos: ['CB'],       r: 87 },
      { i: 1904, n: 'Filipe Luís',       pos: ['LB'],       r: 83 },
      { i: 1905, n: 'Augusto Fernández', pos: ['DM'],       r: 75 },
      { i: 1906, n: 'Gabi',              pos: ['DM', 'CM'], r: 82 }, // capitán
      { i: 1907, n: 'Saúl Ñíguez',       pos: ['CM', 'AM'], r: 84 }, // el golazo a Bayern
      { i: 1908, n: 'Koke',              pos: ['CM', 'LM'], r: 85 },
      { i: 1909, n: 'Yannick Carrasco',  pos: ['LW', 'RW'], r: 82 }, // gol en la final
      { i: 1910, n: 'Antoine Griezmann', pos: ['ST', 'AM'], r: 89 },
      { i: 1911, n: 'Fernando Torres',   pos: ['ST'],       r: 79 },
    ],
  },

  /* ── Juventus · Finalista 2017 ── la defensa italiana eterna; la chilena de Mandžukić. */
  {
    id: 'juv17', name: 'Juventus', edition: 'Finalista 2017', colors: ['#0a0a0a', '#ffffff'], pattern: 'vstripe',
    players: [
      { i: 2000, n: 'Gianluigi Buffon',  pos: ['GK'],       r: 88 }, // capitán
      { i: 2001, n: 'Dani Alves',        pos: ['RB', 'RM'], r: 84 },
      { i: 2002, n: 'Leonardo Bonucci',  pos: ['CB'],       r: 87 },
      { i: 2003, n: 'Giorgio Chiellini', pos: ['CB'],       r: 87 },
      { i: 2004, n: 'Andrea Barzagli',   pos: ['CB', 'RB'], r: 82 },
      { i: 2005, n: 'Alex Sandro',       pos: ['LB'],       r: 83 },
      { i: 2006, n: 'Sami Khedira',      pos: ['CM', 'DM'], r: 81 },
      { i: 2007, n: 'Miralem Pjanić',    pos: ['CM', 'DM'], r: 84 },
      { i: 2008, n: 'Juan Cuadrado',     pos: ['RW', 'RM'], r: 81 },
      { i: 2009, n: 'Paulo Dybala',      pos: ['AM', 'ST'], r: 87 },
      { i: 2010, n: 'Mario Mandžukić',   pos: ['LW', 'ST'], r: 83 }, // LA chilena
      { i: 2011, n: 'Gonzalo Higuaín',   pos: ['ST'],       r: 87 },
    ],
  },

  /* ── Tottenham · Finalista 2019 ── el milagro de Ámsterdam; hat-trick de Lucas en semis. */
  {
    id: 'tot19', name: 'Tottenham', edition: 'Finalista 2019', colors: ['#ffffff', '#132257'], pattern: 'solid',
    players: [
      { i: 2100, n: 'Hugo Lloris',        pos: ['GK'],       r: 84 }, // capitán
      { i: 2101, n: 'Kieran Trippier',    pos: ['RB'],       r: 79 },
      { i: 2102, n: 'Toby Alderweireld',  pos: ['CB'],       r: 83 },
      { i: 2103, n: 'Jan Vertonghen',     pos: ['CB', 'LB'], r: 83 },
      { i: 2104, n: 'Danny Rose',         pos: ['LB'],       r: 79 },
      { i: 2105, n: 'Moussa Sissoko',     pos: ['CM', 'DM'], r: 78 },
      { i: 2106, n: 'Harry Winks',        pos: ['CM'],       r: 76 },
      { i: 2107, n: 'Christian Eriksen',  pos: ['AM', 'CM'], r: 86 },
      { i: 2108, n: 'Dele Alli',          pos: ['AM'],       r: 82 },
      { i: 2109, n: 'Lucas Moura',        pos: ['RW', 'LW'], r: 81 }, // hat-trick en Ámsterdam
      { i: 2110, n: 'Son Heung-min',      pos: ['LW', 'ST'], r: 86 },
      { i: 2111, n: 'Harry Kane',         pos: ['ST'],       r: 88 },
    ],
  },

  /* ── PSG · Finalista 2020 ── Neymar-Mbappé en la burbuja de Lisboa; cayó 0-1 con Bayern. */
  {
    id: 'psg20', name: 'PSG', edition: 'Finalista 2020', colors: ['#004170', '#da291c', '#ffffff'], pattern: 'band',
    players: [
      { i: 2200, n: 'Keylor Navas',     pos: ['GK'],       r: 85 },
      { i: 2201, n: 'Thilo Kehrer',     pos: ['RB', 'CB'], r: 76 },
      { i: 2202, n: 'Thiago Silva',     pos: ['CB'],       r: 86 }, // capitán
      { i: 2203, n: 'Presnel Kimpembe', pos: ['CB'],       r: 81 },
      { i: 2204, n: 'Juan Bernat',      pos: ['LB'],       r: 80 },
      { i: 2205, n: 'Marquinhos',       pos: ['DM', 'CB'], r: 85 },
      { i: 2206, n: 'Ander Herrera',    pos: ['CM'],       r: 79 },
      { i: 2207, n: 'Leandro Paredes',  pos: ['CM', 'DM'], r: 80 },
      { i: 2208, n: 'Ángel Di María',   pos: ['RW', 'AM'], r: 87 },
      { i: 2209, n: 'Neymar',           pos: ['LW', 'AM'], r: 91 },
      { i: 2210, n: 'Kylian Mbappé',    pos: ['ST', 'LW'], r: 92 },
      { i: 2211, n: 'Mauro Icardi',     pos: ['ST'],       r: 82 },
    ],
  },

  /* ── PSG · Champions 2025 ── Luis Enrique; el 5-0 a Inter en Múnich, la primera Orejona. */
  {
    id: 'psg25', name: 'PSG', edition: 'Champions 2025', colors: ['#004170', '#da291c', '#ffffff'], pattern: 'band',
    players: [
      { i: 2300, n: 'Gianluigi Donnarumma',  pos: ['GK'],       r: 88 },
      { i: 2301, n: 'Achraf Hakimi',         pos: ['RB', 'RM'], r: 88 }, // gol en la final
      { i: 2302, n: 'Marquinhos',            pos: ['CB'],       r: 85 }, // capitán
      { i: 2303, n: 'Willian Pacho',         pos: ['CB'],       r: 83 },
      { i: 2304, n: 'Nuno Mendes',           pos: ['LB', 'LM'], r: 87 },
      { i: 2305, n: 'Vitinha',               pos: ['CM', 'DM'], r: 88 },
      { i: 2306, n: 'João Neves',            pos: ['CM', 'DM'], r: 85 },
      { i: 2307, n: 'Fabián Ruiz',           pos: ['CM', 'AM'], r: 84 },
      { i: 2308, n: 'Désiré Doué',           pos: ['RW', 'AM'], r: 86 }, // doblete en la final
      { i: 2309, n: 'Ousmane Dembélé',       pos: ['ST', 'RW'], r: 91 }, // el año del Balón de Oro
      { i: 2310, n: 'Khvicha Kvaratskhelia', pos: ['LW'],       r: 87 },
      { i: 2311, n: 'Bradley Barcola',       pos: ['LW', 'RW'], r: 83 },
    ],
  },

  /* ════════════════════════════════════════
     DATASET v3 — segunda tanda: 4 campeones de banda media-alta y 3
     finalistas míticos en banda baja. La varianza crece por arriba y por
     abajo; la curva de dificultad no se rompe.
  ════════════════════════════════════════ */

  /* ── Ajax · Champions 1995 ── los pibes de Van Gaal; campeones invictos. */
  {
    id: 'aja95', name: 'Ajax', edition: 'Champions 1995', colors: ['#ffffff', '#d2122e'], pattern: 'band',
    players: [
      { i: 2400, n: 'Edwin van der Sar', pos: ['GK'],       r: 87 },
      { i: 2401, n: 'Michael Reiziger',  pos: ['RB'],       r: 80 },
      { i: 2402, n: 'Danny Blind',       pos: ['CB'],       r: 83 }, // capitán
      { i: 2403, n: 'Frank de Boer',     pos: ['CB', 'LB'], r: 84 },
      { i: 2404, n: 'Frank Rijkaard',    pos: ['DM', 'CB'], r: 87 },
      { i: 2405, n: 'Edgar Davids',      pos: ['CM', 'DM'], r: 85 },
      { i: 2406, n: 'Clarence Seedorf',  pos: ['CM', 'AM'], r: 84 },
      { i: 2407, n: 'Jari Litmanen',     pos: ['AM'],       r: 87 },
      { i: 2408, n: 'Finidi George',     pos: ['RW'],       r: 80 },
      { i: 2409, n: 'Marc Overmars',     pos: ['LW'],       r: 86 },
      { i: 2410, n: 'Patrick Kluivert',  pos: ['ST'],       r: 84 }, // el gol de la final con 18
      { i: 2411, n: 'Ronald de Boer',    pos: ['CM', 'ST'], r: 81 },
    ],
  },

  /* ── Juventus · Champions 1996 ── la Juve de Lippi; ganó la tanda en Roma. */
  {
    id: 'juv96', name: 'Juventus', edition: 'Champions 1996', colors: ['#0a0a0a', '#ffffff'], pattern: 'vstripe',
    players: [
      { i: 2500, n: 'Angelo Peruzzi',     pos: ['GK'],       r: 85 },
      { i: 2501, n: 'Moreno Torricelli',  pos: ['RB'],       r: 77 },
      { i: 2502, n: 'Ciro Ferrara',       pos: ['CB'],       r: 84 },
      { i: 2503, n: 'Pietro Vierchowod',  pos: ['CB'],       r: 83 },
      { i: 2504, n: 'Gianluca Pessotto',  pos: ['LB'],       r: 78 },
      { i: 2505, n: 'Didier Deschamps',   pos: ['DM'],       r: 84 },
      { i: 2506, n: 'Antonio Conte',      pos: ['CM', 'RM'], r: 82 },
      { i: 2507, n: 'Paulo Sousa',        pos: ['DM', 'CM'], r: 83 },
      { i: 2508, n: 'Vladimir Jugović',   pos: ['CM', 'AM'], r: 80 }, // el penal del título
      { i: 2509, n: 'Alessandro Del Piero', pos: ['AM', 'ST'], r: 88 },
      { i: 2510, n: 'Gianluca Vialli',    pos: ['ST'],       r: 87 }, // capitán
      { i: 2511, n: 'Fabrizio Ravanelli', pos: ['ST', 'LW'], r: 84 },
    ],
  },

  /* ── Bayern München · Champions 2001 ── Kahn atajó tres en la tanda de Milán. */
  {
    id: 'mun01', name: 'Bayern München', edition: 'Champions 2001', colors: ['#dc052d', '#0066b2'], pattern: 'solid',
    players: [
      { i: 2600, n: 'Oliver Kahn',        pos: ['GK'],       r: 91 }, // héroe de la tanda
      { i: 2601, n: 'Willy Sagnol',       pos: ['RB'],       r: 80 },
      { i: 2602, n: 'Samuel Kuffour',     pos: ['CB'],       r: 83 },
      { i: 2603, n: 'Patrik Andersson',   pos: ['CB'],       r: 81 },
      { i: 2604, n: 'Bixente Lizarazu',   pos: ['LB'],       r: 86 },
      { i: 2605, n: 'Jens Jeremies',      pos: ['DM'],       r: 79 },
      { i: 2606, n: 'Owen Hargreaves',    pos: ['DM', 'CM'], r: 78 },
      { i: 2607, n: 'Stefan Effenberg',   pos: ['CM', 'AM'], r: 87 }, // capitán
      { i: 2608, n: 'Mehmet Scholl',      pos: ['AM', 'RW'], r: 86 },
      { i: 2609, n: 'Hasan Salihamidžić', pos: ['RM', 'RW'], r: 80 },
      { i: 2610, n: 'Giovane Élber',      pos: ['ST'],       r: 85 },
      { i: 2611, n: 'Paulo Sérgio',       pos: ['LW', 'ST'], r: 78 },
    ],
  },

  /* ── Real Madrid · Champions 2002 ── la Novena; LA volea de Zidane en Glasgow. */
  {
    id: 'rma02', name: 'Real Madrid', edition: 'Champions 2002', colors: ['#ffffff', '#febe10'], pattern: 'solid',
    players: [
      { i: 2700, n: 'Iker Casillas',   pos: ['GK'],       r: 87 }, // entró y la salvó
      { i: 2701, n: 'Míchel Salgado',  pos: ['RB'],       r: 80 },
      { i: 2702, n: 'Fernando Hierro', pos: ['CB', 'DM'], r: 87 }, // capitán
      { i: 2703, n: 'Iván Helguera',   pos: ['CB', 'DM'], r: 82 },
      { i: 2704, n: 'Roberto Carlos',  pos: ['LB', 'LM'], r: 89 },
      { i: 2705, n: 'Claude Makélélé', pos: ['DM'],       r: 86 },
      { i: 2706, n: 'Guti',            pos: ['CM', 'AM'], r: 81 },
      { i: 2707, n: 'Santiago Solari', pos: ['LM', 'LW'], r: 79 },
      { i: 2708, n: 'Luís Figo',       pos: ['RW', 'RM'], r: 90 },
      { i: 2709, n: 'Zinedine Zidane', pos: ['AM', 'CM'], r: 94 }, // LA volea
      { i: 2710, n: 'Raúl',            pos: ['ST'],       r: 90 },
      { i: 2711, n: 'Fernando Morientes', pos: ['ST'],    r: 85 },
    ],
  },

  /* ── Valencia · Finalista 2001 ── dos finales seguidas; cayó por penales en Milán. */
  {
    id: 'val01', name: 'Valencia', edition: 'Finalista 2001', colors: ['#ffffff', '#ee3524'], pattern: 'solid',
    players: [
      { i: 2800, n: 'Santiago Cañizares', pos: ['GK'],       r: 85 },
      { i: 2801, n: 'Jocelyn Angloma',    pos: ['RB'],       r: 79 },
      { i: 2802, n: 'Roberto Ayala',      pos: ['CB'],       r: 86 },
      { i: 2803, n: 'Mauricio Pellegrino',pos: ['CB'],       r: 79 },
      { i: 2804, n: 'Amedeo Carboni',     pos: ['LB'],       r: 78 },
      { i: 2805, n: 'Rubén Baraja',       pos: ['CM', 'DM'], r: 83 },
      { i: 2806, n: 'Gaizka Mendieta',    pos: ['RM', 'CM'], r: 87 }, // la estrella
      { i: 2807, n: 'Kily González',      pos: ['LM', 'LW'], r: 82 },
      { i: 2808, n: 'Pablo Aimar',        pos: ['AM'],       r: 84 },
      { i: 2809, n: 'Vicente',            pos: ['LW', 'LM'], r: 81 },
      { i: 2810, n: 'John Carew',         pos: ['ST'],       r: 80 },
      { i: 2811, n: 'Juan Sánchez',       pos: ['ST', 'RW'], r: 76 },
    ],
  },

  /* ── Bayer Leverkusen · Finalista 2002 ── el Neverkusen; lo mató la volea. */
  {
    id: 'lev02', name: 'Bayer Leverkusen', edition: 'Finalista 2002', colors: ['#e32221', '#0a0a0a'], pattern: 'solid',
    players: [
      { i: 2900, n: 'Hans-Jörg Butt',    pos: ['GK'],       r: 80 },
      { i: 2901, n: 'Diego Placente',    pos: ['LB'],       r: 77 },
      { i: 2902, n: 'Lúcio',             pos: ['CB'],       r: 85 },
      { i: 2903, n: 'Jens Nowotny',      pos: ['CB', 'DM'], r: 81 },
      { i: 2904, n: 'Bernd Schneider',   pos: ['RM', 'RW'], r: 84 },
      { i: 2905, n: 'Carsten Ramelow',   pos: ['DM', 'CB'], r: 80 },
      { i: 2906, n: 'Michael Ballack',   pos: ['CM', 'AM'], r: 89 },
      { i: 2907, n: 'Zé Roberto',        pos: ['LM', 'LW'], r: 84 },
      { i: 2908, n: 'Yıldıray Baştürk',  pos: ['AM'],       r: 82 },
      { i: 2909, n: 'Oliver Neuville',   pos: ['ST', 'RW'], r: 81 },
      { i: 2910, n: 'Ulf Kirsten',       pos: ['ST'],       r: 79 },
      { i: 2911, n: 'Dimitar Berbatov',  pos: ['ST'],       r: 80 },
    ],
  },

  /* ── Inter · Finalista 2023 ── le plantó cara al City de Estambul. */
  {
    id: 'int23', name: 'Inter', edition: 'Finalista 2023', colors: ['#0068a8', '#0a0a0a'], pattern: 'vstripe',
    players: [
      { i: 3000, n: 'André Onana',        pos: ['GK'],       r: 85 },
      { i: 3001, n: 'Matteo Darmian',     pos: ['RB', 'CB'], r: 79 },
      { i: 3002, n: 'Francesco Acerbi',   pos: ['CB'],       r: 82 },
      { i: 3003, n: 'Alessandro Bastoni', pos: ['CB', 'LB'], r: 85 },
      { i: 3004, n: 'Denzel Dumfries',    pos: ['RM', 'RB'], r: 82 },
      { i: 3005, n: 'Federico Dimarco',   pos: ['LM', 'LB'], r: 84 },
      { i: 3006, n: 'Nicolò Barella',     pos: ['CM'],       r: 86 },
      { i: 3007, n: 'Hakan Çalhanoğlu',   pos: ['DM', 'CM'], r: 86 },
      { i: 3008, n: 'Marcelo Brozović',   pos: ['DM', 'CM'], r: 84 },
      { i: 3009, n: 'Henrikh Mkhitaryan', pos: ['CM', 'AM'], r: 81 },
      { i: 3010, n: 'Lautaro Martínez',   pos: ['ST'],       r: 87 }, // capitán
      { i: 3011, n: 'Edin Džeko',         pos: ['ST'],       r: 81 },
    ],
  },
];