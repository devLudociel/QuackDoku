import type { ImageSourcePropType } from 'react-native';
import { generatePuzzle, type PuzzleDifficulty } from '../lib/puzzleGenerator';
import { puzzleToBoardData } from '../lib/puzzleToBoardData';

export interface BoardCell {
  row: number;
  col: number;
}

export interface Room {
  room_id: string;
  room_name: string;
  room_color: string;
  cells: BoardCell[];
}

export interface InitialValue {
  row: number;
  col: number;
  duck_id: string;
  is_fixed: boolean;
}

export interface SolutionCell {
  row: number;
  col: number;
  duck_id: string;
}

export type BoardPlayMode = 'latin' | 'murdoku';
export type SceneObjectType = 'table' | 'chair' | 'plant' | 'shelf' | 'rug';

export interface SceneObject extends BoardCell {
  object_id: string;
  object_type: SceneObjectType;
  label: string;
}

export interface SuspectClue {
  duck_id: string;
  clue: string;
  highlight_cells: BoardCell[];
}

export interface BoardData {
  board_id: string;
  grid_size: { rows: number; cols: number };
  duck_count: number;
  duck_ids: string[]; // which ducks appear in this puzzle
  play_mode?: BoardPlayMode;
  blocked_cells?: BoardCell[];
  scene_objects?: SceneObject[];
  rooms: Room[];
  initial_values: InitialValue[];
  solution: SolutionCell[];
  /**
   * Optional pre-rendered scene image that fills the whole grid. When set, the
   * board renders it as the background and skips drawing region colours/borders,
   * room labels and scene-object icons (they're already painted in the image).
   */
  background_image?: ImageSourcePropType;
}

export interface CaseRewards {
  coins: number;
  xp: number;
  clues: number;
  unlock_character: string | null;
}

export interface GameCase {
  case_id: string;
  title: string;
  subtitle: string;
  difficulty: number; // 1-5
  location: string;
  story_intro: string;
  story_resolution: string;
  suspects: string[];
  culprit: string;
  victim: string;
  board: BoardData;
  rewards: CaseRewards;
  narrative_clues: string[];
  logic_clues: string[];
  suspect_clues: SuspectClue[];
  time_target: number; // seconds for 3 stars
  is_premium: boolean;
  prerequisite_cases: string[];
  tags: string[];
}

// ─── CASO 1: El Robo del Collar Dorado ───────────────────────────────────────
// 6x6 grid, 6 ducks, 6 irregular rooms of 6 cells each
// Rooms are built against the solution so each one contains every duck once.
const CASE_001_BOARD: Omit<BoardData, 'initial_values' | 'solution'> = {
  board_id: 'case_001_board',
  grid_size: { rows: 6, cols: 6 },
  duck_count: 6,
  duck_ids: ['duck_tophat', 'duck_plum', 'duck_chef', 'duck_detective', 'duck_butler', 'duck_cowboy'],
  play_mode: 'murdoku',
  blocked_cells: [],
  scene_objects: [
    { row: 0, col: 1, object_id: 'table_kitchen_1', object_type: 'table', label: 'mesa' },
    { row: 0, col: 4, object_id: 'shelf_library_1', object_type: 'shelf', label: 'estantería' },
    { row: 0, col: 5, object_id: 'chair_library_1', object_type: 'chair', label: 'silla' },
    { row: 1, col: 4, object_id: 'table_library_1', object_type: 'table', label: 'mesa' },
    { row: 1, col: 5, object_id: 'shelf_library_2', object_type: 'shelf', label: 'estantería' },
    { row: 2, col: 1, object_id: 'rug_living_1', object_type: 'rug', label: 'alfombra' },
    { row: 2, col: 4, object_id: 'plant_garden_1', object_type: 'plant', label: 'planta' },
    { row: 2, col: 5, object_id: 'chair_library_2', object_type: 'chair', label: 'silla' },
    { row: 3, col: 1, object_id: 'shelf_lobby_1', object_type: 'shelf', label: 'estantería' },
    { row: 3, col: 2, object_id: 'rug_garden_1', object_type: 'rug', label: 'alfombra' },
    { row: 4, col: 3, object_id: 'table_dining_1', object_type: 'table', label: 'mesa' },
    { row: 4, col: 4, object_id: 'plant_garden_2', object_type: 'plant', label: 'planta' },
    { row: 4, col: 5, object_id: 'table_dining_2', object_type: 'table', label: 'mesa' },
    { row: 5, col: 1, object_id: 'shelf_lobby_2', object_type: 'shelf', label: 'estantería' },
    { row: 5, col: 4, object_id: 'chair_dining_1', object_type: 'chair', label: 'silla' },
  ],
  rooms: [
    {
      room_id: 'kitchen',
      room_name: 'Cocina',
      room_color: 'rgba(244, 164, 96, 0.30)',
      cells: [
        { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
        { row: 1, col: 1 }, { row: 1, col: 2 },
      ],
    },
    {
      room_id: 'library',
      room_name: 'Biblioteca',
      room_color: 'rgba(173, 216, 230, 0.30)',
      cells: [
        { row: 0, col: 4 }, { row: 0, col: 5 },
        { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
        { row: 2, col: 5 },
      ],
    },
    {
      room_id: 'living_room',
      room_name: 'Salón',
      room_color: 'rgba(144, 238, 144, 0.30)',
      cells: [
        { row: 1, col: 0 },
        { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
        { row: 3, col: 1 },
      ],
    },
    {
      room_id: 'garden',
      room_name: 'Jardín',
      room_color: 'rgba(255, 182, 193, 0.30)',
      cells: [
        { row: 2, col: 4 },
        { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
        { row: 4, col: 4 },
      ],
    },
    {
      room_id: 'dining_room',
      room_name: 'Comedor',
      room_color: 'rgba(221, 160, 221, 0.30)',
      cells: [
        { row: 4, col: 3 }, { row: 4, col: 5 },
        { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 },
      ],
    },
    {
      room_id: 'lobby',
      room_name: 'Recibidor',
      room_color: 'rgba(255, 228, 181, 0.30)',
      cells: [
        { row: 3, col: 0 },
        { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 },
        { row: 5, col: 0 }, { row: 5, col: 1 },
      ],
    },
  ],
};

// Murdoku solution: each suspect appears exactly once, and no two suspects
// share a row or column. The culprit and victim are alone together in one room.
const CASE_001_SOLUTION: SolutionCell[] = [
  { row: 0, col: 0, duck_id: 'duck_tophat' },
  { row: 1, col: 3, duck_id: 'duck_butler' },
  { row: 2, col: 5, duck_id: 'duck_cowboy' },
  { row: 3, col: 2, duck_id: 'duck_chef' },
  { row: 4, col: 4, duck_id: 'duck_plum' },
  { row: 5, col: 1, duck_id: 'duck_detective' },
];

const CASE_001_INITIAL: InitialValue[] = [];

export const CASE_001: GameCase = {
  case_id: 'case_001',
  title: 'El Collar Dorado',
  subtitle: 'Un robo terminó en asesinato durante la gala',
  difficulty: 2,
  location: 'Quackwell Manor',
  story_intro:
    'Durante la gala anual de la Mansión Quackwell, el Collar Dorado desapareció y Dama Plumetta apareció sin vida. Reconstruye dónde estuvo cada sospechoso: cada pato ocupa una sola casilla y nadie comparte fila ni columna.',
  story_resolution:
    'El collar estaba escondido junto al invernadero del Jardín. Chef Gustó quedó a solas con Dama Plumetta y aprovechó el apagón para robar la joya.',
  suspects: ['duck_tophat', 'duck_plum', 'duck_chef', 'duck_detective', 'duck_butler', 'duck_cowboy'],
  culprit: 'duck_chef',
  victim: 'duck_plum',
  board: {
    ...CASE_001_BOARD,
    initial_values: CASE_001_INITIAL,
    solution: CASE_001_SOLUTION,
  },
  rewards: { coins: 150, xp: 50, clues: 1, unlock_character: null },
  narrative_clues: [
    'Lord Quackson saludó desde la esquina noroeste al empezar la gala.',
    'Sr. Billington y Sheriff Plumas fueron vistos en la Biblioteca; el sheriff estaba más al este.',
    'Detective Waddles terminó la noche en el Recibidor.',
    'Dama Plumetta fue la víctima y estaba en el Jardín.',
    'Chef Gustó estuvo a solas con la víctima en el Jardín.',
  ],
  logic_clues: [],
  suspect_clues: [
    {
      duck_id: 'duck_tophat',
      clue: 'Él estaba en la esquina noroeste.',
      highlight_cells: [{ row: 0, col: 0 }],
    },
    {
      duck_id: 'duck_plum',
      clue: 'La víctima. Estaba sola con el asesino.',
      highlight_cells: [
        { row: 2, col: 4 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 3, col: 5 },
        { row: 4, col: 4 },
      ],
    },
    {
      duck_id: 'duck_chef',
      clue: 'Él estaba sobre una alfombra del Jardín.',
      highlight_cells: [{ row: 3, col: 2 }],
    },
    {
      duck_id: 'duck_detective',
      clue: 'Él estaba en el Recibidor.',
      highlight_cells: [
        { row: 3, col: 0 },
        { row: 4, col: 0 },
        { row: 4, col: 1 },
        { row: 4, col: 2 },
        { row: 5, col: 0 },
        { row: 5, col: 1 },
      ],
    },
    {
      duck_id: 'duck_butler',
      clue: 'Él estaba en la Biblioteca, al oeste del sheriff.',
      highlight_cells: [
        { row: 0, col: 4 },
        { row: 0, col: 5 },
        { row: 1, col: 3 },
        { row: 1, col: 4 },
        { row: 1, col: 5 },
        { row: 2, col: 5 },
      ],
    },
    {
      duck_id: 'duck_cowboy',
      clue: 'Él estaba sentado en una silla de la Biblioteca.',
      highlight_cells: [{ row: 2, col: 5 }],
    },
  ],
  time_target: 600, // 10 minutes for 3 stars
  is_premium: false,
  prerequisite_cases: [],
  tags: ['mansion', 'robo', 'gastronomia'],
};

// ─── CASOS GENERADOS (modo latin / "sudoku de patos") ───────────────────────
// Estos casos se construyen con el generador procedural. Cada pato aparece una
// vez por fila, columna y sala. No llevan pistas narrativas (el panel de pistas
// solo aparece en modo murdoku). El seed fijo hace que el tablero sea estable.

const CATALOGUE_DUCK_POOL = [
  'duck_tophat', 'duck_plum', 'duck_chef', 'duck_detective', 'duck_butler', 'duck_cowboy',
  'duck_witch', 'duck_pirate', 'duck_king', 'duck_ninja', 'duck_robot', 'duck_witch2',
];

const CATALOGUE_RATING: Record<PuzzleDifficulty, number> = { easy: 2, medium: 3, hard: 5 };
const CATALOGUE_TIME: Record<PuzzleDifficulty, number> = { easy: 360, medium: 540, hard: 720 };
const CATALOGUE_COINS: Record<PuzzleDifficulty, number> = { easy: 120, medium: 180, hard: 260 };
const CATALOGUE_XP: Record<PuzzleDifficulty, number> = { easy: 30, medium: 60, hard: 90 };

interface GeneratedCaseSpec {
  case_id: string;
  seed: string;
  title: string;
  location: string;
  story_intro: string;
  story_resolution: string;
  difficulty: PuzzleDifficulty;
  duckOffset: number;
  roomNames: string[]; // 6 area names matching the theme
  prerequisite_cases: string[];
  tags: string[];
  unlock_character?: string | null;
}

function makeGeneratedCase(spec: GeneratedCaseSpec): GameCase {
  const duckIds = Array.from(
    { length: 6 },
    (_, i) => CATALOGUE_DUCK_POOL[(spec.duckOffset + i) % CATALOGUE_DUCK_POOL.length]
  );
  const puzzle = generatePuzzle(spec.seed, {
    size: 6,
    playMode: 'latin',
    difficulty: spec.difficulty,
    duckIds,
    roomNames: spec.roomNames,
  });
  const board = puzzleToBoardData(puzzle, { boardId: `${spec.case_id}_board`, decorations: 3 });

  return {
    case_id: spec.case_id,
    title: spec.title,
    subtitle: 'Puzzle de lógica · cada pato una vez por fila, columna y sala',
    difficulty: CATALOGUE_RATING[spec.difficulty],
    location: spec.location,
    story_intro: spec.story_intro,
    story_resolution: spec.story_resolution,
    suspects: duckIds.slice(),
    culprit: duckIds[0],
    victim: duckIds[duckIds.length - 1],
    board,
    rewards: {
      coins: CATALOGUE_COINS[spec.difficulty],
      xp: CATALOGUE_XP[spec.difficulty],
      clues: 1,
      unlock_character: spec.unlock_character ?? null,
    },
    narrative_clues: [],
    logic_clues: [],
    suspect_clues: [],
    time_target: CATALOGUE_TIME[spec.difficulty],
    is_premium: false,
    prerequisite_cases: spec.prerequisite_cases,
    tags: spec.tags,
  };
}

export const CASE_002: GameCase = makeGeneratedCase({
  case_id: 'case_002',
  seed: 'quackdoku-case-002',
  title: 'El Patrón de la Cocina',
  location: 'Cocina de la Mansión Quackwell',
  story_intro:
    'Alguien reordenó toda la despensa de Chef Gustó. Reconstruye dónde estuvo cada pato: cada sospechoso aparece una sola vez en cada fila, cada columna y cada sala.',
  story_resolution: 'Despensa reconstruida. La lógica nunca falla, detective.',
  difficulty: 'easy',
  duckOffset: 1,
  roomNames: ['Despensa', 'Horno', 'Fregadero', 'Bodega', 'Mesón', 'Trastienda'],
  prerequisite_cases: ['case_001'],
  tags: ['mansion', 'logica', 'cocina'],
});

export const CASE_003: GameCase = makeGeneratedCase({
  case_id: 'case_003',
  seed: 'quackdoku-case-003',
  title: 'Enigma de la Biblioteca',
  location: 'Biblioteca Vieja',
  story_intro:
    'Los libros prohibidos cambiaron de estante durante la noche. Coloca a cada pato siguiendo la regla: una vez por fila, columna y sala.',
  story_resolution: 'Cada libro vuelve a su sitio. Caso archivado.',
  difficulty: 'medium',
  duckOffset: 3,
  roomNames: ['Archivo', 'Lectura', 'Mapas', 'Reservados', 'Pasillo', 'Catálogo'],
  prerequisite_cases: ['case_002'],
  tags: ['mansion', 'logica', 'biblioteca'],
});

export const CASE_004: GameCase = makeGeneratedCase({
  case_id: 'case_004',
  seed: 'quackdoku-case-004',
  title: 'El Laberinto del Jardín',
  location: 'Jardín de Invierno',
  story_intro:
    'El jardinero juró que los setos se movieron solos. Demuestra el orden correcto: cada sospechoso una vez por fila, columna y sala.',
  story_resolution: 'El laberinto tiene sentido otra vez. Buen ojo.',
  difficulty: 'medium',
  duckOffset: 5,
  roomNames: ['Setos', 'Fuente', 'Invernadero', 'Rosaleda', 'Estanque', 'Pérgola'],
  prerequisite_cases: ['case_003'],
  tags: ['mansion', 'logica', 'jardin'],
});

export const CASE_005: GameCase = makeGeneratedCase({
  case_id: 'case_005',
  seed: 'quackdoku-case-005',
  title: 'El Acertijo del Salón Negro',
  location: 'Salón Negro',
  story_intro:
    'En el salón sin ventanas, nadie recuerda dónde estaba. Solo la lógica resuelve esto: una vez por fila, columna y sala.',
  story_resolution: 'Las luces vuelven. El acertijo cae. Caso cerrado.',
  difficulty: 'hard',
  duckOffset: 7,
  roomNames: ['Ala Norte', 'Ala Sur', 'Centro', 'Galería', 'Rincón', 'Vestíbulo'],
  prerequisite_cases: ['case_004'],
  tags: ['mansion', 'logica', 'experto'],
});

// ─── CASO 6: El Jardín de Atrás (escenario con imagen) ──────────────────────
// Murdoku 9x9 sobre una lamina pre-renderizada (`assets/escenario1.png`).
// PRIMERA PASADA: las regiones y celdas bloqueadas son una aproximacion a la
// imagen; hay que afinarlas mirando la lamina en el movil. La solucion y las
// pistas son auto-consistentes con esa aproximacion.

const escenario1Asset = require('../assets/escenario1.png') as ImageSourcePropType;

function rectCells(r0: number, r1: number, c0: number, c1: number): BoardCell[] {
  const out: BoardCell[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c });
  return out;
}

const CASE_006_REGIONS = {
  backyard: [...rectCells(0, 2, 0, 2), ...rectCells(3, 5, 2, 4)],
  pond: rectCells(0, 2, 3, 6),
  garden: rectCells(0, 2, 7, 8),
  shed: rectCells(3, 5, 0, 1),
  sunroom: rectCells(3, 5, 5, 8),
  bedroom: rectCells(6, 8, 0, 2),
  living: rectCells(6, 8, 3, 5),
  kitchen: rectCells(6, 8, 6, 8),
};

const CASE_006_DUCKS = CATALOGUE_DUCK_POOL.slice(0, 9); // tophat..king

const CASE_006_SOLUTION: SolutionCell[] = [
  { row: 0, col: 4, duck_id: 'duck_tophat' },    // POND
  { row: 1, col: 1, duck_id: 'duck_plum' },       // BACKYARD (víctima)
  { row: 2, col: 7, duck_id: 'duck_chef' },       // GARDEN
  { row: 3, col: 0, duck_id: 'duck_detective' },  // SHED
  { row: 4, col: 6, duck_id: 'duck_butler' },     // SUNROOM
  { row: 5, col: 2, duck_id: 'duck_cowboy' },     // BACKYARD (asesino)
  { row: 6, col: 8, duck_id: 'duck_witch' },      // KITCHEN
  { row: 7, col: 3, duck_id: 'duck_pirate' },     // LIVING ROOM
  { row: 8, col: 5, duck_id: 'duck_king' },       // LIVING ROOM
];

const CASE_006_BLOCKED: BoardCell[] = [
  { row: 0, col: 1 }, { row: 0, col: 8 }, { row: 1, col: 4 }, { row: 1, col: 7 },
  { row: 2, col: 5 }, { row: 2, col: 6 }, { row: 3, col: 1 }, { row: 4, col: 0 },
  { row: 3, col: 7 }, { row: 4, col: 7 }, { row: 6, col: 3 }, { row: 6, col: 4 },
  { row: 8, col: 0 }, { row: 8, col: 7 }, { row: 6, col: 6 },
];

const REGION_PALETTE_006: Record<string, string> = {
  backyard: 'rgba(144, 238, 144, 0.30)',
  pond: 'rgba(135, 206, 235, 0.30)',
  garden: 'rgba(205, 133, 63, 0.30)',
  shed: 'rgba(169, 169, 169, 0.30)',
  sunroom: 'rgba(216, 191, 216, 0.30)',
  bedroom: 'rgba(255, 228, 181, 0.30)',
  living: 'rgba(255, 218, 185, 0.30)',
  kitchen: 'rgba(240, 230, 140, 0.30)',
};

export const CASE_006: GameCase = {
  case_id: 'case_006',
  title: 'El Jardín de Atrás',
  subtitle: 'Reconstruye dónde estaba cada sospechoso en el jardín',
  difficulty: 2,
  location: 'Quackwell Manor — jardín trasero',
  story_intro:
    'Dama Plumetta apareció sin vida en el jardín trasero. Lee la pista de cada sospechoso y encuentra su casilla exacta: cada pato ocupa una sola casilla y nadie comparte fila ni columna. El asesino estuvo a solas con la víctima, en su misma área.',
  story_resolution:
    'Todos los caminos llevaban al estanque y al jardín. Sheriff Plumas quedó a solas con Dama Plumetta en el Jardín Trasero.',
  suspects: CASE_006_DUCKS,
  culprit: 'duck_cowboy',
  victim: 'duck_plum',
  board: {
    board_id: 'case_006_board',
    grid_size: { rows: 9, cols: 9 },
    duck_count: 9,
    duck_ids: CASE_006_DUCKS,
    play_mode: 'murdoku',
    blocked_cells: CASE_006_BLOCKED,
    scene_objects: [],
    rooms: [
      { room_id: 'backyard', room_name: 'Jardín Trasero', room_color: REGION_PALETTE_006.backyard, cells: CASE_006_REGIONS.backyard },
      { room_id: 'pond', room_name: 'Estanque', room_color: REGION_PALETTE_006.pond, cells: CASE_006_REGIONS.pond },
      { room_id: 'garden', room_name: 'Jardín de Flores', room_color: REGION_PALETTE_006.garden, cells: CASE_006_REGIONS.garden },
      { room_id: 'shed', room_name: 'Cobertizo', room_color: REGION_PALETTE_006.shed, cells: CASE_006_REGIONS.shed },
      { room_id: 'sunroom', room_name: 'Galería', room_color: REGION_PALETTE_006.sunroom, cells: CASE_006_REGIONS.sunroom },
      { room_id: 'bedroom', room_name: 'Dormitorio', room_color: REGION_PALETTE_006.bedroom, cells: CASE_006_REGIONS.bedroom },
      { room_id: 'living', room_name: 'Salón', room_color: REGION_PALETTE_006.living, cells: CASE_006_REGIONS.living },
      { room_id: 'kitchen', room_name: 'Cocina', room_color: REGION_PALETTE_006.kitchen, cells: CASE_006_REGIONS.kitchen },
    ],
    initial_values: [],
    solution: CASE_006_SOLUTION,
    background_image: escenario1Asset,
  },
  rewards: { coins: 200, xp: 70, clues: 1, unlock_character: null },
  narrative_clues: [
    'Cada sospechoso ocupa una sola casilla; nadie comparte fila ni columna.',
    'El asesino estaba a solas con la víctima, en su misma área.',
  ],
  logic_clues: [],
  suspect_clues: [
    { duck_id: 'duck_tophat', clue: 'Estaba junto al Estanque.', highlight_cells: CASE_006_REGIONS.pond },
    { duck_id: 'duck_plum', clue: 'La víctima. Estaba a solas con el asesino, en su misma área.', highlight_cells: CASE_006_REGIONS.backyard },
    { duck_id: 'duck_chef', clue: 'Estaba en el Jardín de Flores.', highlight_cells: CASE_006_REGIONS.garden },
    { duck_id: 'duck_detective', clue: 'Estaba en el Cobertizo.', highlight_cells: CASE_006_REGIONS.shed },
    { duck_id: 'duck_butler', clue: 'Estaba en la Galería, al lado de una mesa.', highlight_cells: CASE_006_REGIONS.sunroom },
    { duck_id: 'duck_cowboy', clue: 'Estaba en el Jardín Trasero.', highlight_cells: CASE_006_REGIONS.backyard },
    { duck_id: 'duck_witch', clue: 'Estaba en la Cocina.', highlight_cells: CASE_006_REGIONS.kitchen },
    { duck_id: 'duck_pirate', clue: 'Estaba en el Salón.', highlight_cells: CASE_006_REGIONS.living },
    { duck_id: 'duck_king', clue: 'Estaba sentado en el Salón.', highlight_cells: CASE_006_REGIONS.living },
  ],
  time_target: 720,
  is_premium: false,
  prerequisite_cases: ['case_001'],
  tags: ['mansion', 'jardin', 'escenario'],
};

export const ALL_CASES: GameCase[] = [CASE_001, CASE_002, CASE_003, CASE_004, CASE_005, CASE_006];

export const CASE_MAP: Record<string, GameCase> = Object.fromEntries(
  ALL_CASES.map((c) => [c.case_id, c])
);
