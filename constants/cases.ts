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

export const ALL_CASES: GameCase[] = [CASE_001];

export const CASE_MAP: Record<string, GameCase> = Object.fromEntries(
  ALL_CASES.map((c) => [c.case_id, c])
);
