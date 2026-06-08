/* ══════════════════════════════════════════
   DATA — players.ts  (v1: UEFA Champions League)

   Single source of game data: champion squads + formations.

   POSITIONS: fine positions, 1–2 per player (natural first). A player
   is eligible for a slot only if the slot's position is in `pos`
   (strict, no penalty — the dual position is the flexibility).

   TEAMS: European Cup / Champions League winners, picked for global
   name-recognition. Squad membership is from the well-known finals;
   fine-position tags and ratings are a first, editable pass.

   IDENTITY: each team carries 1–3 own brand COLORS (no crests/kits).
══════════════════════════════════════════ */

export type Pos =
  | 'GK'
  | 'RB' | 'CB' | 'LB'
  | 'DM' | 'CM' | 'AM' | 'RM' | 'LM'
  | 'RW' | 'LW' | 'ST';

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
    id: 'rma22', name: 'Real Madrid', edition: 'Champions 2022', colors: ['#e9e9e9', '#1d2b6b', '#c8a24a'],
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
    id: 'bar11', name: 'Barcelona', edition: 'Champions 2011', colors: ['#a50044', '#004d98', '#edbb00'],
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
    id: 'fcb20', name: 'Bayern München', edition: 'Champions 2020', colors: ['#dc052d', '#0066b2'],
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
    id: 'liv19', name: 'Liverpool', edition: 'Champions 2019', colors: ['#c8102e', '#f6eb61'],
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
    id: 'mci23', name: 'Manchester City', edition: 'Champions 2023', colors: ['#6cabdd', '#1c2c5b'],
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
    id: 'int10', name: 'Inter', edition: 'Champions 2010', colors: ['#0a0a0a', '#1f4fb6'],
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
    id: 'acm07', name: 'AC Milan', edition: 'Champions 2007', colors: ['#fb090b', '#0a0a0a'],
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

  /* ── Manchester United · Champions 2008 ── Ferguson; Ronaldo's year; beat Chelsea on pens. */
  {
    id: 'mun08', name: 'Manchester United', edition: 'Champions 2008', colors: ['#da020e', '#f5f5f5', '#0a0a0a'],
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
];