/* ══════════════════════════════════════════
   DATA — players.ts

   Single source of game data: champion squads + formations.

   POSITIONS (Fase 2 model, 7a0-style):
   - Fine positions, and each player is catalogued for ONE or TWO
     of them (`pos`). The first one is the natural position.
   - A player is eligible for a pitch slot if the slot's position
     is in the player's `pos`. No out-of-position penalty: a player
     simply fits a slot or it doesn't (then you draw another champion).

   Ratings are 0–99, legacy-based, SUBJECTIVE, tune freely.
   Squad membership is verified from public records; fine position
   tags are best-effort and meant to be adjusted.
══════════════════════════════════════════ */

export type Pos =
  | 'GK'
  | 'RB' | 'CB' | 'LB'        // defenders
  | 'DM' | 'CM' | 'AM' | 'RM' | 'LM' // midfielders
  | 'RW' | 'LW' | 'ST';      // forwards

export interface Player {
  i: number;   // unique id (used in the share code later)
  n: string;   // name
  pos: Pos[];  // 1–2 positions, natural first
  r: number;   // rating 0–99
}

export interface Team {
  id: string;
  name: string;
  edition: string;
  color: string; // OWN brand accent (not an official club color/logo)
  players: Player[];
}

/* A pitch slot: a required position plus where it sits on the board,
   as percentages (x: left→right, y: top→bottom; GK near the bottom). */
export interface Slot {
  pos: Pos;
  x: number;
  y: number;
}

/* Formations are ORDERED slot layouts now (not just counts), so the
   board can draw the XI in its real shape. Add more here freely. */
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
  /* ── Nacional · Libertadores 1988 ── beat Newell's 3-0 in the Centenario final. */
  {
    id: 'nac88', name: 'Nacional', edition: 'Libertadores 1988', color: '#4a7fb5',
    players: [
      { i: 100, n: 'Jorge Seré',            pos: ['GK'],       r: 80 },
      { i: 101, n: 'Tony Gómez',            pos: ['RB', 'CB'], r: 79 },
      { i: 102, n: 'Hugo De León',          pos: ['CB'],       r: 87 }, // captain, idol
      { i: 103, n: 'Daniel Revelez',        pos: ['CB', 'RB'], r: 78 },
      { i: 104, n: 'J. L. Pintos Saldanha', pos: ['LB'],       r: 76 },
      { i: 105, n: 'Enrique Saravia',       pos: ['CB', 'LB'], r: 74 },
      { i: 106, n: 'Santiago Ostolaza',     pos: ['CM', 'AM'], r: 83 }, // scored in the final
      { i: 107, n: 'Jorge Cardaccio',       pos: ['DM', 'CM'], r: 76 },
      { i: 108, n: 'Yubert Lemos',          pos: ['CM'],       r: 75 },
      { i: 109, n: 'Daniel Carreño',        pos: ['CM', 'RM'], r: 75 },
      { i: 110, n: 'Martín Lasarte',        pos: ['LM', 'CM'], r: 73 },
      { i: 111, n: 'Ernesto Vargas',        pos: ['ST'],       r: 78 }, // scored in the final
      { i: 112, n: 'Juan Carlos De Lima',   pos: ['ST', 'RW'], r: 76 },
      { i: 113, n: 'William Castro',        pos: ['RW'],       r: 77 },
      { i: 114, n: 'Héctor Morán',          pos: ['LW', 'ST'], r: 73 },
    ],
  },

  /* ── Peñarol · Libertadores 1987 ── Aguirre's goal at minute 119 vs América de Cali. */
  {
    id: 'pen87', name: 'Peñarol', edition: 'Libertadores 1987', color: '#e8b400',
    players: [
      { i: 200, n: 'Eduardo Pereira',   pos: ['GK'],       r: 80 },
      { i: 201, n: 'José Herrera',      pos: ['RB', 'CB'], r: 78 },
      { i: 202, n: 'Marcelo Rotti',     pos: ['CB'],       r: 76 },
      { i: 203, n: 'Obdulio Trasante',  pos: ['CB'],       r: 79 },
      { i: 204, n: 'Alfonso Domínguez', pos: ['LB'],       r: 77 },
      { i: 205, n: 'José Perdomo',      pos: ['CM', 'DM'], r: 82 },
      { i: 206, n: 'Eduardo Da Silva',  pos: ['CM'],       r: 77 },
      { i: 207, n: 'Daniel Vidal',      pos: ['CM', 'AM'], r: 76 },
      { i: 208, n: 'Gustavo Matosas',   pos: ['CM', 'RM'], r: 75 },
      { i: 209, n: 'Jorge Villar',      pos: ['LM', 'LW'], r: 74 },
      { i: 210, n: 'Ricardo Viera',     pos: ['ST', 'RW'], r: 77 },
      { i: 211, n: 'Jorge Cabrera',     pos: ['ST'],       r: 76 },
      { i: 212, n: 'Diego Aguirre',     pos: ['ST'],       r: 84 }, // the hero
    ],
  },

  /* ── Santos · Libertadores 1963 ── Pelé's Santos, back-to-back champions (1962–63). */
  {
    id: 'san63', name: 'Santos', edition: 'Libertadores 1963', color: '#20242b',
    players: [
      { i: 500, n: 'Gilmar',      pos: ['GK'],       r: 85 },
      { i: 501, n: 'Mauro Ramos', pos: ['CB'],       r: 82 }, // captain
      { i: 502, n: 'Dalmo',       pos: ['RB'],       r: 76 },
      { i: 503, n: 'Calvet',      pos: ['CB'],       r: 76 },
      { i: 504, n: 'Geraldino',   pos: ['CB', 'LB'], r: 74 },
      { i: 505, n: 'Zito',        pos: ['CM', 'DM'], r: 84 },
      { i: 506, n: 'Mengálvio',   pos: ['CM', 'AM'], r: 80 },
      { i: 507, n: 'Lima',        pos: ['LB', 'LM'], r: 77 },
      { i: 508, n: 'Dorval',      pos: ['RW'],       r: 79 },
      { i: 509, n: 'Coutinho',    pos: ['ST'],       r: 88 },
      { i: 510, n: 'Pelé',        pos: ['ST', 'AM'], r: 99 }, // O Rei
      { i: 511, n: 'Pepe',        pos: ['LW', 'ST'], r: 86 },
      { i: 512, n: 'Pagão',       pos: ['ST'],       r: 76 },
    ],
  },

  /* ── Estudiantes (LP) · Libertadores 1968 ── Zubeldía; beat Palmeiras 2-0 in the Centenario playoff. */
  {
    id: 'est68', name: 'Estudiantes', edition: 'Libertadores 1968', color: '#9b2335',
    players: [
      { i: 600, n: 'Alberto Poletti',      pos: ['GK'],       r: 80 },
      { i: 601, n: 'Oscar Malbernat',      pos: ['LB', 'CB'], r: 80 }, // captain
      { i: 602, n: 'Ramón Aguirre Suárez', pos: ['CB'],       r: 79 },
      { i: 603, n: 'Raúl Madero',          pos: ['CB'],       r: 78 },
      { i: 604, n: 'José Medina',          pos: ['RB', 'LB'], r: 77 },
      { i: 605, n: 'Carlos Bilardo',       pos: ['CM', 'AM'], r: 83 },
      { i: 606, n: 'Carlos Pachamé',       pos: ['DM', 'CM'], r: 80 },
      { i: 607, n: 'Eduardo Flores',       pos: ['CM'],       r: 76 },
      { i: 608, n: 'Néstor Togneri',       pos: ['DM', 'CM'], r: 76 },
      { i: 609, n: 'Felipe Ribaudo',       pos: ['RW', 'AM'], r: 78 }, // scored in the final
      { i: 610, n: 'Marcos Conigliaro',    pos: ['ST'],       r: 80 },
      { i: 611, n: 'Juan Ramón Verón',     pos: ['AM', 'ST'], r: 86 }, // scored in the final
      { i: 612, n: 'Juan Echecopar',       pos: ['ST'],       r: 74 },
    ],
  },

  /* ── Flamengo · Libertadores 1981 ── Zico; beat Cobreloa, then Liverpool. */
  {
    id: 'fla81', name: 'Flamengo', edition: 'Libertadores 1981', color: '#8c1d24',
    players: [
      { i: 700, n: 'Raúl',     pos: ['GK'],       r: 80 },
      { i: 701, n: 'Leandro',  pos: ['RB'],       r: 85 },
      { i: 702, n: 'Marinho',  pos: ['CB'],       r: 80 },
      { i: 703, n: 'Mozer',    pos: ['CB'],       r: 82 },
      { i: 704, n: 'Júnior',   pos: ['LB', 'LM'], r: 87 },
      { i: 705, n: 'Nei Dias', pos: ['CB', 'RB'], r: 77 },
      { i: 706, n: 'Andrade',  pos: ['DM', 'CM'], r: 80 },
      { i: 707, n: 'Zico',     pos: ['AM', 'CM'], r: 95 }, // top scorer, the genius
      { i: 708, n: 'Adílio',   pos: ['CM'],       r: 79 },
      { i: 709, n: 'Tita',     pos: ['RW', 'ST'], r: 80 },
      { i: 710, n: 'Nunes',    pos: ['ST'],       r: 82 },
      { i: 711, n: 'Lico',     pos: ['LW', 'AM'], r: 77 },
      { i: 712, n: 'Anselmo',  pos: ['ST'],       r: 74 },
    ],
  },

  /* ── Independiente · Libertadores 1984 ── "Rey de Copas" 7th title; beat Grêmio. */
  {
    id: 'ind84', name: 'Independiente', edition: 'Libertadores 1984', color: '#d8342a',
    players: [
      { i: 800, n: 'Carlos Goyén',       pos: ['GK'],       r: 80 },
      { i: 801, n: 'Néstor Clausen',     pos: ['RB'],       r: 79 },
      { i: 802, n: 'Hugo Villaverde',    pos: ['CB'],       r: 79 },
      { i: 803, n: 'Enzo Trossero',      pos: ['CB'],       r: 82 }, // captain
      { i: 804, n: 'Carlos Enrique',     pos: ['LB'],       r: 78 },
      { i: 805, n: 'Rodolfo Zimmermann', pos: ['CB', 'RB'], r: 74 },
      { i: 806, n: 'Ricardo Giusti',     pos: ['CM', 'DM'], r: 84 },
      { i: 807, n: 'Claudio Marangoni',  pos: ['CM', 'AM'], r: 83 },
      { i: 808, n: 'Ricardo Bochini',    pos: ['AM', 'CM'], r: 90 }, // El Bocha, idol
      { i: 809, n: 'Jorge Burruchaga',   pos: ['AM', 'RW'], r: 87 }, // scored in the final
      { i: 810, n: 'Sergio Bufarini',    pos: ['ST', 'RW'], r: 77 },
      { i: 811, n: 'Alejandro Barberón', pos: ['ST'],       r: 76 },
      { i: 812, n: 'René Houseman',      pos: ['RW', 'LW'], r: 78 },
    ],
  },

  /* ── Atlético Nacional · Libertadores 1989 ── first Colombian champion; Higuita; beat Olimpia on pens. */
  {
    id: 'atn89', name: 'Atlético Nacional', edition: 'Libertadores 1989', color: '#1f8a4c',
    players: [
      { i: 900, n: 'René Higuita',          pos: ['GK'],       r: 87 }, // shootout hero
      { i: 901, n: 'John Jairo Carmona',    pos: ['RB', 'CB'], r: 77 },
      { i: 902, n: 'Luis Carlos Perea',     pos: ['CB'],       r: 80 },
      { i: 903, n: 'Andrés Escobar',        pos: ['CB'],       r: 84 },
      { i: 904, n: 'Gildardo Gómez',        pos: ['LB', 'CB'], r: 78 },
      { i: 905, n: 'Luis Fernando Herrera', pos: ['CB', 'RB'], r: 78 },
      { i: 906, n: 'Leonel Álvarez',        pos: ['DM', 'CM'], r: 84 }, // decisive penalty
      { i: 907, n: 'Alexis García',         pos: ['CM', 'AM'], r: 82 }, // captain
      { i: 908, n: 'Luis Alfonso Fajardo',  pos: ['CM'],       r: 76 },
      { i: 909, n: 'Jaime Arango',          pos: ['RM', 'LM'], r: 77 },
      { i: 910, n: 'Felipe Pérez',          pos: ['LM', 'LW'], r: 76 },
      { i: 911, n: 'Albeiro Usuriaga',      pos: ['ST', 'LW'], r: 82 }, // "El Palomo"
      { i: 912, n: 'John Jairo Tréllez',    pos: ['ST'],       r: 80 },
    ],
  },

  /* ── São Paulo · Libertadores 1992 ── Telê Santana; beat Bielsa's Newell's on pens. */
  {
    id: 'sao92', name: 'São Paulo', edition: 'Libertadores 1992', color: '#b23a48',
    players: [
      { i: 1000, n: 'Zetti',          pos: ['GK'],       r: 82 },
      { i: 1001, n: 'Cafú',           pos: ['RB'],       r: 86 }, // future World Cup winner
      { i: 1002, n: 'Antônio Carlos', pos: ['CB'],       r: 79 },
      { i: 1003, n: 'Ronaldão',       pos: ['CB'],       r: 79 },
      { i: 1004, n: 'Ivan',           pos: ['LB'],       r: 76 },
      { i: 1005, n: 'Adílson',        pos: ['DM', 'CM'], r: 78 },
      { i: 1006, n: 'Pintado',        pos: ['DM', 'CM'], r: 78 },
      { i: 1007, n: 'Raí',            pos: ['AM', 'CM'], r: 90 }, // captain, scored the final pen
      { i: 1008, n: 'Elivélton',      pos: ['LM', 'LW'], r: 78 },
      { i: 1009, n: 'Müller',         pos: ['ST', 'RW'], r: 85 },
      { i: 1010, n: 'Palhinha',       pos: ['ST'],       r: 82 }, // top scorer of the cup
      { i: 1011, n: 'Macedo',         pos: ['ST'],       r: 78 },
      { i: 1012, n: 'Rinaldo',        pos: ['ST'],       r: 76 },
    ],
  },

  /* ── Boca Juniors · Libertadores 2000 ── Bianchi; Riquelme + Palermo; beat Real Madrid weeks later. */
  {
    id: 'boc00', name: 'Boca Juniors', edition: 'Libertadores 2000', color: '#1f4e9b',
    players: [
      { i: 300, n: 'Óscar Córdoba',          pos: ['GK'],       r: 85 },
      { i: 301, n: 'Hugo Ibarra',            pos: ['RB'],       r: 81 },
      { i: 302, n: 'Jorge Bermúdez',         pos: ['CB'],       r: 83 },
      { i: 303, n: 'Walter Samuel',          pos: ['CB'],       r: 88 }, // future world-class
      { i: 304, n: 'Rodolfo Arruabarrena',   pos: ['LB'],       r: 80 },
      { i: 305, n: 'Sebastián Battaglia',    pos: ['DM', 'CM'], r: 81 },
      { i: 306, n: 'Cristian Traverso',      pos: ['DM', 'CB'], r: 78 },
      { i: 307, n: 'José Basualdo',          pos: ['CM'],       r: 80 },
      { i: 308, n: 'Juan Román Riquelme',    pos: ['AM', 'CM'], r: 92 }, // the genius
      { i: 309, n: 'Diego Cagna',            pos: ['CM', 'LM'], r: 80 },
      { i: 310, n: 'Mauricio Serna',         pos: ['DM', 'CM'], r: 79 },
      { i: 311, n: 'Guillermo B. Schelotto', pos: ['RW', 'AM'], r: 84 },
      { i: 312, n: 'Martín Palermo',         pos: ['ST'],       r: 87 }, // beat Real Madrid
      { i: 313, n: 'Marcelo Delgado',        pos: ['ST', 'LW'], r: 82 },
    ],
  },

/* ── Santos · Libertadores 2011 ── Muricy Ramalho; Neymar + Ganso; beat Peñarol in the final. */
  {
    id: 'san11', name: 'Santos', edition: 'Libertadores 2011', color: '#13202b',
    players: [
      { i: 1300, n: 'Rafael',        pos: ['GK'],       r: 80 },
      { i: 1301, n: 'Danilo',        pos: ['RB'],       r: 83 },
      { i: 1302, n: 'Edu Dracena',   pos: ['CB'],       r: 80 },
      { i: 1303, n: 'Durval',        pos: ['CB'],       r: 78 },
      { i: 1304, n: 'Léo',           pos: ['LB', 'LM'], r: 79 },
      { i: 1305, n: 'Pará',          pos: ['RB', 'CB'], r: 77 },
      { i: 1306, n: 'Arouca',        pos: ['DM', 'CM'], r: 80 },
      { i: 1307, n: 'Ibson',         pos: ['CM', 'DM'], r: 78 },
      { i: 1308, n: 'Elano',         pos: ['AM', 'RM'], r: 82 },
      { i: 1309, n: 'Ganso',         pos: ['AM', 'CM'], r: 84 },
      { i: 1310, n: 'Neymar',        pos: ['LW', 'ST'], r: 90 }, // crack, figura del torneo
      { i: 1311, n: 'Borges',        pos: ['ST'],       r: 80 },
      { i: 1312, n: 'Alan Kardec',   pos: ['ST'],       r: 76 },
    ],
  },

  /* ── River Plate · Libertadores 2018 ── Gallardo; Quintero's golazo vs Boca in Madrid. */
  {
    id: 'riv18', name: 'River Plate', edition: 'Libertadores 2018', color: '#d6213a',
    players: [
      { i: 400, n: 'Franco Armani',           pos: ['GK'],       r: 86 },
      { i: 401, n: 'Gonzalo Montiel',         pos: ['RB'],       r: 82 },
      { i: 402, n: 'Javier Pinola',           pos: ['CB'],       r: 82 },
      { i: 403, n: 'Jonatan Maidana',         pos: ['CB'],       r: 80 },
      { i: 404, n: 'Milton Casco',            pos: ['LB'],       r: 79 },
      { i: 405, n: 'L. Martínez Quarta',      pos: ['CB'],       r: 80 },
      { i: 406, n: 'Enzo Pérez',              pos: ['CM', 'DM'], r: 84 },
      { i: 407, n: 'Exequiel Palacios',       pos: ['CM', 'DM'], r: 83 },
      { i: 408, n: 'Gonzalo "Pity" Martínez', pos: ['AM', 'RW'], r: 87 }, // best of the Americas
      { i: 409, n: 'Juan F. Quintero',        pos: ['AM', 'LM'], r: 86 }, // the golazo
      { i: 410, n: 'Ignacio Fernández',       pos: ['AM', 'CM'], r: 84 },
      { i: 411, n: 'Lucas Pratto',            pos: ['ST'],       r: 83 },
      { i: 412, n: 'Rafael Santos Borré',     pos: ['ST', 'LW'], r: 82 },
      { i: 413, n: 'Julián Álvarez',          pos: ['ST'],       r: 81 }, // the young one
    ],
  },

  /* ── Flamengo · Libertadores 2019 ── Jorge Jesus; Gabigol's late brace beat River 2-1 in Lima. */
  {
    id: 'fla19', name: 'Flamengo', edition: 'Libertadores 2019', color: '#cf2127',
    players: [
      { i: 1100, n: 'Diego Alves',     pos: ['GK'],       r: 84 },
      { i: 1101, n: 'Rafinha',         pos: ['RB'],       r: 81 },
      { i: 1102, n: 'Rodrigo Caio',    pos: ['CB'],       r: 82 },
      { i: 1103, n: 'Pablo Marí',      pos: ['CB'],       r: 80 },
      { i: 1104, n: 'Filipe Luís',     pos: ['LB'],       r: 84 },
      { i: 1105, n: 'William Arão',    pos: ['DM', 'CB'], r: 80 },
      { i: 1106, n: 'Gerson',          pos: ['CM'],       r: 83 },
      { i: 1107, n: 'Everton Ribeiro', pos: ['AM', 'RM'], r: 84 }, // captain
      { i: 1108, n: 'Arrascaeta',      pos: ['AM', 'LW'], r: 87 }, // assisted the equalizer
      { i: 1109, n: 'Diego',           pos: ['AM', 'CM'], r: 80 },
      { i: 1110, n: 'Bruno Henrique',  pos: ['LW', 'ST'], r: 86 }, // best player of the cup
      { i: 1111, n: 'Gabigol',         pos: ['ST'],       r: 88 }, // top scorer, final brace
      { i: 1112, n: 'Vitinho',         pos: ['RW', 'ST'], r: 77 },
    ],
  },

  /* ── Palmeiras · Libertadores 2021 ── Abel Ferreira; Deyverson's ET goal beat Flamengo in the Centenario. */
  {
    id: 'pal21', name: 'Palmeiras', edition: 'Libertadores 2021', color: '#15703a',
    players: [
      { i: 1200, n: 'Weverton',       pos: ['GK'],       r: 82 },
      { i: 1201, n: 'Mayke',          pos: ['RB'],       r: 79 },
      { i: 1202, n: 'Gustavo Gómez',  pos: ['CB'],       r: 84 }, // captain
      { i: 1203, n: 'Luan',           pos: ['CB'],       r: 79 },
      { i: 1204, n: 'Piquerez',       pos: ['LB'],       r: 82 },
      { i: 1205, n: 'Danilo',         pos: ['DM', 'CM'], r: 83 },
      { i: 1206, n: 'Zé Rafael',      pos: ['CM', 'DM'], r: 80 },
      { i: 1207, n: 'Gustavo Scarpa', pos: ['AM', 'LM'], r: 82 },
      { i: 1208, n: 'Raphael Veiga',  pos: ['AM', 'CM'], r: 84 }, // scored in the final
      { i: 1209, n: 'Felipe Melo',    pos: ['DM', 'CB'], r: 79 },
      { i: 1210, n: 'Dudu',           pos: ['RW', 'LW'], r: 83 },
      { i: 1211, n: 'Rony',           pos: ['ST', 'LW'], r: 82 },
      { i: 1212, n: 'Deyverson',      pos: ['ST'],       r: 78 }, // scored the winner in ET
    ],
  },
];