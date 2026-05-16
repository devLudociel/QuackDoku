import type { BoardCell, BoardData, InitialValue, Room, SolutionCell } from '../constants/cases';
import type { PuzzleDifficulty } from './puzzleGenerator';

const ROOM_PALETTE = [
  'rgba(244, 164, 96, 0.30)',
  'rgba(173, 216, 230, 0.30)',
  'rgba(144, 238, 144, 0.30)',
  'rgba(255, 182, 193, 0.30)',
  'rgba(221, 160, 221, 0.30)',
  'rgba(255, 228, 181, 0.30)',
  'rgba(176, 196, 222, 0.30)',
  'rgba(240, 230, 140, 0.30)',
  'rgba(216, 191, 216, 0.30)',
];

const GIVEN_RATIO: Record<PuzzleDifficulty, number> = {
  easy: 0.42,
  medium: 0.32,
  hard: 0.22,
};

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function makeRng(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: string): T[] {
  const rng = makeRng(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rowRooms(size: number, roomNames?: string[]): Room[] {
  return Array.from({ length: size }, (_, row) => ({
    room_id: `row_${row + 1}`,
    room_name: roomNames?.[row] ?? `Fila ${row + 1}`,
    room_color: ROOM_PALETTE[row % ROOM_PALETTE.length],
    cells: Array.from({ length: size }, (_, col) => ({ row, col })) as BoardCell[],
  }));
}

function targetGivenCount(totalCells: number, difficulty: PuzzleDifficulty, size: number): number {
  const raw = Math.round(totalCells * GIVEN_RATIO[difficulty]);
  return Math.max(size, Math.min(totalCells - 2, raw));
}

export function buildFastLatinBoard({
  boardId,
  seed,
  duckIds,
  difficulty,
  roomNames,
}: {
  boardId: string;
  seed: string;
  duckIds: string[];
  difficulty: PuzzleDifficulty;
  roomNames?: string[];
}): BoardData {
  const size = duckIds.length;
  const offset = hashString(seed) % size;
  const solution: SolutionCell[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      solution.push({
        row,
        col,
        duck_id: duckIds[(row + col + offset) % size],
      });
    }
  }

  const byCell = new Map(solution.map((cell) => [`${cell.row},${cell.col}`, cell.duck_id]));
  const allCells: BoardCell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) allCells.push({ row, col });
  }

  const mandatory = Array.from({ length: size }, (_, row) => ({
    row,
    col: (row * 2 + offset) % size,
  }));
  const mandatoryKeys = new Set(mandatory.map((cell) => `${cell.row},${cell.col}`));
  const rest = shuffled(
    allCells.filter((cell) => !mandatoryKeys.has(`${cell.row},${cell.col}`)),
    `${seed}|givens`
  );
  const chosen = [...mandatory, ...rest].slice(0, targetGivenCount(size * size, difficulty, size));
  const initialValues: InitialValue[] = chosen.map((cell) => ({
    ...cell,
    duck_id: byCell.get(`${cell.row},${cell.col}`) ?? duckIds[0],
    is_fixed: true,
  }));

  return {
    board_id: boardId,
    grid_size: { rows: size, cols: size },
    duck_count: size,
    duck_ids: duckIds.slice(),
    play_mode: 'latin',
    blocked_cells: [],
    scene_objects: [],
    rooms: rowRooms(size, roomNames),
    initial_values: initialValues,
    solution,
  };
}
