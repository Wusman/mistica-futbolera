/* ══════════════════════════════════════════
   DATA — players.ts

   Single source of game data: champion squads + formations.
   Short keys (i/n/p/r) keep the payload tiny when this scales
   to thousands of players. Ratings are 0–99, legacy-based,
   and meant to be tuned freely.
══════════════════════════════════════════ */

export type Pos = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  i: number; // unique id (used in the share code later)
  n: string; // name
  p: Pos;    // position
  r: number; // rating 0–99 (the only "visible" attribute)
}

export interface Team {
  id: string;      // short code
  name: string;
  edition: string; // which Libertadores this squad won
  color: string;   // OWN brand accent (not an official club color/logo)
  players: Player[];
}

/* Position counts each formation requires. The build step validates
   the chosen XI against these. */
export const FORMATIONS = {
  '4-3-3': { GK: 1, DF: 4, MF: 3, FW: 3 },
  '4-4-2': { GK: 1, DF: 4, MF: 4, FW: 2 },
} as const;

export type FormationName = keyof typeof FORMATIONS;

export const TEAMS: Team[] = [
  /* ── Nacional · Libertadores 1988 ──────────────────────────
     "Once obreros." No big stars except captain De León, but
     beat Newell's 3-0 in the Centenario final. */
  {
    id: 'nac88',
    name: 'Nacional',
    edition: 'Libertadores 1988',
    color: '#4a7fb5',
    players: [
      { i: 100, n: 'Jorge Seré',            p: 'GK', r: 80 },
      { i: 101, n: 'Tony Gómez',            p: 'DF', r: 79 },
      { i: 102, n: 'Hugo De León',          p: 'DF', r: 87 }, // captain, idol
      { i: 103, n: 'Daniel Revelez',        p: 'DF', r: 78 },
      { i: 104, n: 'J. L. Pintos Saldanha', p: 'DF', r: 76 },
      { i: 105, n: 'Enrique Saravia',       p: 'DF', r: 74 },
      { i: 106, n: 'Santiago Ostolaza',     p: 'MF', r: 83 }, // scored in the final
      { i: 107, n: 'Jorge Cardaccio',       p: 'MF', r: 76 },
      { i: 108, n: 'Yubert Lemos',          p: 'MF', r: 75 },
      { i: 109, n: 'Daniel Carreño',        p: 'MF', r: 75 },
      { i: 110, n: 'Martín Lasarte',        p: 'MF', r: 73 },
      { i: 111, n: 'Ernesto Vargas',        p: 'FW', r: 78 }, // scored in the final
      { i: 112, n: 'Juan Carlos De Lima',   p: 'FW', r: 76 },
      { i: 113, n: 'William Castro',        p: 'FW', r: 77 },
      { i: 114, n: 'Héctor Morán',          p: 'FW', r: 73 },
    ],
  },

  /* ── Peñarol · Libertadores 1987 ──────────────────────────
     Tabárez's young side. Aguirre's goal at minute 120 vs
     América de Cali — the 5th and last (so far). */
  {
    id: 'pen87',
    name: 'Peñarol',
    edition: 'Libertadores 1987',
    color: '#e8b400',
    players: [
      { i: 200, n: 'Eduardo Pereira',   p: 'GK', r: 80 },
      { i: 201, n: 'José Herrera',      p: 'DF', r: 78 },
      { i: 202, n: 'Marcelo Rotti',     p: 'DF', r: 76 },
      { i: 203, n: 'Obdulio Trasante',  p: 'DF', r: 79 },
      { i: 204, n: 'Alfonso Domínguez', p: 'DF', r: 77 },
      { i: 205, n: 'José Perdomo',      p: 'MF', r: 82 },
      { i: 206, n: 'Eduardo Da Silva',  p: 'MF', r: 77 },
      { i: 207, n: 'Daniel Vidal',      p: 'MF', r: 76 },
      { i: 208, n: 'Gustavo Matosas',   p: 'MF', r: 75 },
      { i: 209, n: 'Jorge Villar',      p: 'MF', r: 74 },
      { i: 210, n: 'Ricardo Viera',     p: 'FW', r: 77 },
      { i: 211, n: 'Jorge Cabrera',     p: 'FW', r: 76 },
      { i: 212, n: 'Diego Aguirre',     p: 'FW', r: 84 }, // the hero
    ],
  },

  /* ── Boca Juniors · Libertadores 2000 ─────────────────────
     Bianchi's golden era begins. Riquelme + Palermo; weeks
     later they beat Real Madrid in the Intercontinental. */
  {
    id: 'boc00',
    name: 'Boca Juniors',
    edition: 'Libertadores 2000',
    color: '#1f4e9b',
    players: [
      { i: 300, n: 'Óscar Córdoba',          p: 'GK', r: 85 },
      { i: 301, n: 'Hugo Ibarra',            p: 'DF', r: 81 },
      { i: 302, n: 'Jorge Bermúdez',         p: 'DF', r: 83 },
      { i: 303, n: 'Walter Samuel',          p: 'DF', r: 88 }, // future world-class
      { i: 304, n: 'Rodolfo Arruabarrena',   p: 'DF', r: 80 },
      { i: 305, n: 'Sebastián Battaglia',    p: 'MF', r: 81 },
      { i: 306, n: 'Cristian Traverso',      p: 'MF', r: 78 },
      { i: 307, n: 'José Basualdo',          p: 'MF', r: 80 },
      { i: 308, n: 'Juan Román Riquelme',    p: 'MF', r: 92 }, // the genius
      { i: 309, n: 'Diego Cagna',            p: 'MF', r: 80 },
      { i: 310, n: 'Mauricio Serna',         p: 'MF', r: 79 },
      { i: 311, n: 'Guillermo B. Schelotto', p: 'FW', r: 84 },
      { i: 312, n: 'Martín Palermo',         p: 'FW', r: 87 }, // beat Real Madrid
      { i: 313, n: 'Marcelo Delgado',        p: 'FW', r: 82 },
    ],
  },

  /* ── River Plate · Libertadores 2018 ──────────────────────
     The Madrid final vs Boca. Quintero's golazo in extra time,
     Pity Martínez named best player of the Americas that year. */
  {
    id: 'riv18',
    name: 'River Plate',
    edition: 'Libertadores 2018',
    color: '#d6213a',
    players: [
      { i: 400, n: 'Franco Armani',         p: 'GK', r: 86 },
      { i: 401, n: 'Gonzalo Montiel',       p: 'DF', r: 82 },
      { i: 402, n: 'Javier Pinola',         p: 'DF', r: 82 },
      { i: 403, n: 'Jonatan Maidana',       p: 'DF', r: 80 },
      { i: 404, n: 'Milton Casco',          p: 'DF', r: 79 },
      { i: 405, n: 'L. Martínez Quarta',    p: 'DF', r: 80 },
      { i: 406, n: 'Enzo Pérez',            p: 'MF', r: 84 },
      { i: 407, n: 'Exequiel Palacios',     p: 'MF', r: 83 },
      { i: 408, n: 'Gonzalo "Pity" Martínez', p: 'MF', r: 87 }, // best of the Americas
      { i: 409, n: 'Juan F. Quintero',      p: 'MF', r: 86 }, // the golazo
      { i: 410, n: 'Ignacio Fernández',     p: 'MF', r: 84 },
      { i: 411, n: 'Lucas Pratto',          p: 'FW', r: 83 },
      { i: 412, n: 'Rafael Santos Borré',   p: 'FW', r: 82 },
      { i: 413, n: 'Julián Álvarez',        p: 'FW', r: 81 }, // the young one
    ],
  },
];
