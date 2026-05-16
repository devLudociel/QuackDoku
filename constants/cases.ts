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

// ─── Casos 7-21: catálogo extendido (15 casos generados) ────────────────────

export const CASE_007: GameCase = makeGeneratedCase({
  case_id: 'case_007',
  seed: 'quackdoku-case-007',
  title: 'El Sótano Oculto',
  location: 'Sótano de la Mansión',
  story_intro:
    'Encontraron una puerta tapiada bajo la escalera. Ordena a los testigos: un pato por fila, columna y sala.',
  story_resolution: 'El sótano revela sus secretos. Trabajo limpio.',
  difficulty: 'easy',
  duckOffset: 2,
  roomNames: ['Carbonera', 'Bodega', 'Caldera', 'Trastero', 'Túnel', 'Escalera'],
  prerequisite_cases: ['case_006'],
  tags: ['mansion', 'logica', 'sotano'],
});

export const CASE_008: GameCase = makeGeneratedCase({
  case_id: 'case_008',
  seed: 'quackdoku-case-008',
  title: 'La Galería de Retratos',
  location: 'Galería de Retratos',
  story_intro:
    'Los retratos cambiaron de posición durante la velada. Reconstruye dónde estaba cada pato: una vez por fila, columna y sala.',
  story_resolution: 'Cada retrato vuelve a su clavo. Caso cerrado.',
  difficulty: 'easy',
  duckOffset: 4,
  roomNames: ['Norte', 'Sur', 'Este', 'Oeste', 'Centro', 'Vitrina'],
  prerequisite_cases: ['case_007'],
  tags: ['mansion', 'logica', 'arte'],
});

export const CASE_009: GameCase = makeGeneratedCase({
  case_id: 'case_009',
  seed: 'quackdoku-case-009',
  title: 'El Estudio del Profesor',
  location: 'Estudio de Quackwell',
  story_intro:
    'El profesor jura que no movió ningún papel. Pero alguien sí. Coloca a cada pato siguiendo la regla del cuadrado latino.',
  story_resolution: 'Los apuntes recuperan su orden. La lógica gana.',
  difficulty: 'easy',
  duckOffset: 6,
  roomNames: ['Escritorio', 'Pizarra', 'Librería', 'Archivo', 'Sillón', 'Ventanal'],
  prerequisite_cases: ['case_008'],
  tags: ['mansion', 'logica', 'estudio'],
});

export const CASE_010: GameCase = makeGeneratedCase({
  case_id: 'case_010',
  seed: 'quackdoku-case-010',
  title: 'La Sala de Trofeos',
  location: 'Sala de Trofeos',
  story_intro:
    'Faltan tres copas y nadie quiere admitirlo. Reconstruye las posiciones de los sospechosos sin saltarte la regla.',
  story_resolution: 'Las copas aparecen donde nunca buscaron. Caso resuelto.',
  difficulty: 'easy',
  duckOffset: 0,
  roomNames: ['Vitrina A', 'Vitrina B', 'Pedestal', 'Pared Este', 'Pared Oeste', 'Mesa'],
  prerequisite_cases: ['case_009'],
  tags: ['mansion', 'logica', 'trofeos'],
});

export const CASE_011: GameCase = makeGeneratedCase({
  case_id: 'case_011',
  seed: 'quackdoku-case-011',
  title: 'El Pasillo de los Espejos',
  location: 'Pasillo de los Espejos',
  story_intro:
    'Cada espejo refleja una versión distinta de los hechos. Coloca a cada pato una sola vez por fila, columna y sala.',
  story_resolution: 'Los reflejos coinciden por fin. Buen pulso.',
  difficulty: 'easy',
  duckOffset: 8,
  roomNames: ['Entrada', 'Curva', 'Recodo', 'Bóveda', 'Tramo Largo', 'Salida'],
  prerequisite_cases: ['case_010'],
  tags: ['mansion', 'logica', 'pasillo'],
});

export const CASE_012: GameCase = makeGeneratedCase({
  case_id: 'case_012',
  seed: 'quackdoku-case-012',
  title: 'El Observatorio Astronómico',
  location: 'Observatorio',
  story_intro:
    'El telescopio fue manipulado y las cartas estelares están revueltas. Aplica la lógica sin errores.',
  story_resolution: 'El cielo vuelve a tener sentido. Caso archivado.',
  difficulty: 'medium',
  duckOffset: 1,
  roomNames: ['Cúpula', 'Lente', 'Cartas', 'Plataforma', 'Diario', 'Escalera'],
  prerequisite_cases: ['case_011'],
  tags: ['mansion', 'logica', 'observatorio'],
});

export const CASE_013: GameCase = makeGeneratedCase({
  case_id: 'case_013',
  seed: 'quackdoku-case-013',
  title: 'La Bodega del Mayordomo',
  location: 'Bodega Privada',
  story_intro:
    'Falta una botella de la cosecha del 1924. Reconstruye a quién vio el mayordomo y dónde.',
  story_resolution: 'La cosecha aparece detrás de una pared falsa. Caso resuelto.',
  difficulty: 'medium',
  duckOffset: 3,
  roomNames: ['Cava Norte', 'Cava Sur', 'Barriles', 'Catador', 'Ático Vino', 'Pasillo Frío'],
  prerequisite_cases: ['case_012'],
  tags: ['mansion', 'logica', 'bodega'],
});

export const CASE_014: GameCase = makeGeneratedCase({
  case_id: 'case_014',
  seed: 'quackdoku-case-014',
  title: 'El Conservatorio Musical',
  location: 'Conservatorio',
  story_intro:
    'El piano sonó solo a las tres en punto. Hay seis testigos y seis salas. Encaja la lógica.',
  story_resolution: 'La partitura encaja. Buen oído.',
  difficulty: 'medium',
  duckOffset: 5,
  roomNames: ['Piano', 'Cuerdas', 'Viento', 'Coro', 'Atril', 'Foso'],
  prerequisite_cases: ['case_013'],
  tags: ['mansion', 'logica', 'musica'],
});

export const CASE_015: GameCase = makeGeneratedCase({
  case_id: 'case_015',
  seed: 'quackdoku-case-015',
  title: 'El Salón de Té',
  location: 'Salón de Té',
  story_intro:
    'Alguien envenenó una sola taza. Ordena las posiciones de cada pato y descubre quién estaba donde no debía.',
  story_resolution: 'La taza correcta sale a la luz. Limpio.',
  difficulty: 'medium',
  duckOffset: 7,
  roomNames: ['Mesa Alta', 'Tetera', 'Bandeja', 'Cocina Té', 'Ventana', 'Diván'],
  prerequisite_cases: ['case_014'],
  tags: ['mansion', 'logica', 'salon'],
});

export const CASE_016: GameCase = makeGeneratedCase({
  case_id: 'case_016',
  seed: 'quackdoku-case-016',
  title: 'La Sala de Armas',
  location: 'Sala de Armas',
  story_intro:
    'Una alabarda desapareció del muro. Coloca a cada pato sin romper la regla.',
  story_resolution: 'El arma estaba bajo una armadura. Caso cerrado.',
  difficulty: 'medium',
  duckOffset: 9,
  roomNames: ['Espadas', 'Lanzas', 'Armaduras', 'Escudos', 'Arquería', 'Trofeo'],
  prerequisite_cases: ['case_015'],
  tags: ['mansion', 'logica', 'armas'],
});

export const CASE_017: GameCase = makeGeneratedCase({
  case_id: 'case_017',
  seed: 'quackdoku-case-017',
  title: 'El Ático Polvoriento',
  location: 'Ático',
  story_intro:
    'Huellas frescas en el polvo. Pero seis patos juran que no subieron. Aplica la lógica para descartarlos.',
  story_resolution: 'El intruso queda al descubierto. Detalle fino.',
  difficulty: 'medium',
  duckOffset: 11,
  roomNames: ['Baúles', 'Maniquíes', 'Ventanuco', 'Vigas', 'Cofre', 'Escalera Ático'],
  prerequisite_cases: ['case_016'],
  tags: ['mansion', 'logica', 'atico'],
});

export const CASE_018: GameCase = makeGeneratedCase({
  case_id: 'case_018',
  seed: 'quackdoku-case-018',
  title: 'La Cripta Familiar',
  location: 'Cripta',
  story_intro:
    'Un sarcófago fue abierto. Sin testigos vivos, solo queda la lógica. Coloca a cada pato sin error.',
  story_resolution: 'El profanador es identificado. Trabajo brillante.',
  difficulty: 'hard',
  duckOffset: 2,
  roomNames: ['Nave', 'Altar', 'Sarcófago', 'Cripta Honda', 'Antesala', 'Escalinata'],
  prerequisite_cases: ['case_017'],
  tags: ['mansion', 'logica', 'cripta'],
});

export const CASE_019: GameCase = makeGeneratedCase({
  case_id: 'case_019',
  seed: 'quackdoku-case-019',
  title: 'El Despacho del Notario',
  location: 'Despacho del Notario',
  story_intro:
    'El testamento fue alterado entre las nueve y las diez. Reconstruye con precisión quirúrgica.',
  story_resolution: 'El original aparece en la caja fuerte. Caso cerrado.',
  difficulty: 'hard',
  duckOffset: 4,
  roomNames: ['Bufete', 'Archivo Legal', 'Caja Fuerte', 'Antesala', 'Pasillo', 'Despacho 2'],
  prerequisite_cases: ['case_018'],
  tags: ['mansion', 'logica', 'notario'],
});

export const CASE_020: GameCase = makeGeneratedCase({
  case_id: 'case_020',
  seed: 'quackdoku-case-020',
  title: 'El Invernadero Tropical',
  location: 'Invernadero',
  story_intro:
    'Una orquídea rarísima fue cortada. Seis sospechosos, seis zonas, una sola verdad.',
  story_resolution: 'La orquídea reaparece prensada en un libro. Astuto.',
  difficulty: 'hard',
  duckOffset: 6,
  roomNames: ['Palmeras', 'Orquídeas', 'Helechos', 'Cactus', 'Estanque Cálido', 'Vivero'],
  prerequisite_cases: ['case_019'],
  tags: ['mansion', 'logica', 'invernadero'],
});

export const CASE_021: GameCase = makeGeneratedCase({
  case_id: 'case_021',
  seed: 'quackdoku-case-021',
  title: 'La Torre del Reloj',
  location: 'Torre del Reloj',
  story_intro:
    'El reloj se detuvo exactamente a las once en punto. Reconstruye los movimientos sin saltar ni una regla.',
  story_resolution: 'El mecanismo vuelve a girar. Caso maestro.',
  difficulty: 'hard',
  duckOffset: 8,
  roomNames: ['Esfera', 'Péndulo', 'Engranajes', 'Campana', 'Mirador', 'Hueco Reloj'],
  prerequisite_cases: ['case_020'],
  tags: ['mansion', 'logica', 'torre'],
});

// ─── CASO 6: El Jardín de Atrás (escenario con imagen) ──────────────────────
// Murdoku 9x9 sobre la lamina pre-renderizada `assets/escenario1.png`.
// Modela la logica de "The Backyard Garden": pistas A-H/V, objetos no
// ocupables y solucion final de la pagina de resolucion.

const escenario1Asset = require('../assets/escenario1.png') as ImageSourcePropType;

function rectCells(r0: number, r1: number, c0: number, c1: number): BoardCell[] {
  const out: BoardCell[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ row: r, col: c });
  return out;
}

function cells(...coords: Array<[number, number]>): BoardCell[] {
  return coords.map(([row, col]) => ({ row, col }));
}

const CASE_006_REGIONS = {
  backyard: cells(
    [0, 0], [0, 1], [0, 2],
    [1, 0], [1, 1],
    [2, 0], [2, 1], [2, 3], [2, 4], [2, 5],
    [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7],
    [4, 3],
    [5, 1], [5, 2], [5, 3],
    [6, 0], [6, 1]
  ),
  pond: cells([0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 2]),
  garden: [...rectCells(0, 2, 6, 8), { row: 3, col: 8 }],
  shed: cells([4, 0], [4, 1], [4, 2], [5, 0]),
  sunroom: rectCells(4, 5, 4, 8),
  bedroom: cells([6, 2], [7, 0], [7, 1], [7, 2], [8, 0], [8, 1], [8, 2]),
  living: rectCells(6, 8, 3, 5),
  kitchen: rectCells(6, 8, 6, 8),
};

const CASE_006_DUCKS = [
  'duck_tophat',    // A
  'duck_chef',      // B
  'duck_witch',     // C, murderer
  'duck_detective', // D
  'duck_butler',    // E
  'duck_cowboy',    // F
  'duck_pirate',    // G
  'duck_king',      // H
  'duck_plum',      // V, victim
];

const CASE_006_SOLUTION: SolutionCell[] = [
  { row: 7, col: 5, duck_id: 'duck_tophat' },    // A - Living Room
  { row: 4, col: 1, duck_id: 'duck_chef' },      // B - Shed
  { row: 0, col: 0, duck_id: 'duck_witch' },     // C - Backyard, beside tree
  { row: 6, col: 2, duck_id: 'duck_detective' }, // D - Bedroom
  { row: 8, col: 4, duck_id: 'duck_butler' },    // E - Living Room chair
  { row: 5, col: 6, duck_id: 'duck_cowboy' },    // F - Sunroom carpet
  { row: 2, col: 8, duck_id: 'duck_pirate' },    // G - Garden
  { row: 1, col: 3, duck_id: 'duck_king' },      // H - Pond, alone
  { row: 3, col: 7, duck_id: 'duck_plum' },      // V - Backyard, alone with C
];

const CASE_006_TREE_CELLS = cells([0, 1], [2, 5]);
const CASE_006_CARPET_CELLS = cells([5, 5], [5, 6], [7, 2], [8, 2], [7, 6], [7, 7], [8, 6]);
const CASE_006_CHAIR_CELLS = cells([4, 6], [4, 8], [5, 4], [8, 0], [8, 4]);
const CASE_006_BESIDE_TREE_CELLS = cells([0, 0], [0, 2], [1, 1], [1, 5], [2, 4], [2, 6], [3, 5]);

const CASE_006_BLOCKED: BoardCell[] = [
  ...CASE_006_TREE_CELLS,
  { row: 0, col: 4 }, { row: 1, col: 2 }, // lily pads
  { row: 0, col: 8 }, { row: 2, col: 7 }, { row: 3, col: 0 }, { row: 3, col: 6 }, { row: 6, col: 1 }, // flowers
  { row: 3, col: 8 }, { row: 4, col: 7 }, { row: 7, col: 1 }, { row: 7, col: 3 }, { row: 7, col: 8 }, { row: 8, col: 8 }, // tables
  { row: 4, col: 0 }, { row: 6, col: 3 }, { row: 6, col: 5 }, // shelves
  { row: 6, col: 4 }, { row: 8, col: 7 }, // TV / stove
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
    'V apareció sin vida en el jardín trasero. Lee la pista de cada sospechoso y encuentra su casilla exacta: cada pato ocupa una sola casilla y nadie comparte fila ni columna. El asesino estuvo a solas con la víctima, en su misma área.',
  story_resolution:
    'C quedó a solas con V en el Jardín Trasero. La reconstrucción encaja fila por fila y columna por columna.',
  suspects: CASE_006_DUCKS,
  culprit: 'duck_witch',
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
  logic_clues: [
    'No se pueden ocupar objetos del escenario: árboles, flores, mesas, estantes, sillas, TV, cocina ni nenúfares.',
    'Junto a significa compartir lado: izquierda, derecha, arriba o abajo; nunca diagonal.',
  ],
  suspect_clues: [
    { duck_id: 'duck_tophat', clue: 'A: estaba con E en el Living Room.', highlight_cells: CASE_006_REGIONS.living },
    { duck_id: 'duck_chef', clue: 'B: estaba en el Shed.', highlight_cells: CASE_006_REGIONS.shed },
    { duck_id: 'duck_witch', clue: 'C: estaba junto a un árbol.', highlight_cells: CASE_006_BESIDE_TREE_CELLS },
    { duck_id: 'duck_detective', clue: 'D: estaba en Bedroom o Sunroom.', highlight_cells: [...CASE_006_REGIONS.bedroom, ...CASE_006_REGIONS.sunroom] },
    { duck_id: 'duck_butler', clue: 'E: estaba sentada en una silla.', highlight_cells: CASE_006_CHAIR_CELLS },
    { duck_id: 'duck_cowboy', clue: 'F: estaba sobre una alfombra.', highlight_cells: CASE_006_CARPET_CELLS },
    { duck_id: 'duck_pirate', clue: 'G: estaba en Garden.', highlight_cells: CASE_006_REGIONS.garden },
    { duck_id: 'duck_king', clue: 'H: estaba solo en su zona.', highlight_cells: [] },
    { duck_id: 'duck_plum', clue: 'V: la víctima estaba a solas con el asesino.', highlight_cells: [] },
  ],
  time_target: 720,
  is_premium: false,
  prerequisite_cases: ['case_001'],
  tags: ['mansion', 'jardin', 'escenario'],
};

export const ALL_CASES: GameCase[] = [
  CASE_001,
  CASE_002,
  CASE_003,
  CASE_004,
  CASE_005,
  CASE_006,
  CASE_007,
  CASE_008,
  CASE_009,
  CASE_010,
  CASE_011,
  CASE_012,
  CASE_013,
  CASE_014,
  CASE_015,
  CASE_016,
  CASE_017,
  CASE_018,
  CASE_019,
  CASE_020,
  CASE_021,
];

export const CASE_MAP: Record<string, GameCase> = Object.fromEntries(
  ALL_CASES.map((c) => [c.case_id, c])
);
