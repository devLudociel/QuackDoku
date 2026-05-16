/**
 * Adapter: turns a `GeneratedPuzzle` (from `lib/puzzleGenerator.ts`) into a
 * `BoardData` that the game and `boardValidator.ts` understand.
 *
 * Rooms:
 *  - `latin` puzzles carry valid regions (jigsaw or box) -> reused as-is.
 *  - puzzles with no regions (murdoku, or latin forced to plain) fall back to
 *    one room per grid row. A row strip is contiguous, covers the grid, and —
 *    for latin — trivially contains every duck once, so it's valid for both.
 *
 * Optionally scatters purely-decorative scene objects (`opts.decorations`) on
 * empty cells so generated boards don't look bare. They don't affect play.
 * No narrative/suspect clues are copied; those belong to authored cases.
 */

import type {
  BoardCell,
  BoardData,
  Room,
  SceneObject,
  SceneObjectType,
} from '../constants/cases';
import type { GeneratedPuzzle } from './puzzleGenerator';

const FALLBACK_ROOM_PALETTE = [
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

const DECOR_TYPES: SceneObjectType[] = ['plant', 'shelf', 'rug', 'table', 'chair'];
const DECOR_LABELS: Record<SceneObjectType, string> = {
  plant: 'planta',
  shelf: 'estantería',
  rug: 'alfombra',
  table: 'mesa',
  chair: 'silla',
};

export interface PuzzleToBoardOptions {
  /** Overrides the generated `board_id`. */
  boardId?: string;
  /** How many decorative scene objects to scatter on empty cells (purely visual). */
  decorations?: number;
}

function rowStripRooms(size: number): Room[] {
  return Array.from({ length: size }, (_, row) => ({
    room_id: `row_${row + 1}`,
    room_name: `Fila ${row + 1}`,
    room_color: FALLBACK_ROOM_PALETTE[row % FALLBACK_ROOM_PALETTE.length],
    cells: Array.from({ length: size }, (_, col) => ({ row, col })) as BoardCell[],
  }));
}

function cloneRoom(room: Room): Room {
  return {
    room_id: room.room_id,
    room_name: room.room_name,
    room_color: room.room_color,
    cells: room.cells.map((c) => ({ row: c.row, col: c.col })),
  };
}

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function buildDecorations(
  boardId: string,
  size: number,
  occupied: ReadonlySet<string>,
  count: number,
): SceneObject[] {
  if (count <= 0) return [];
  const free: BoardCell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!occupied.has(`${row},${col}`)) free.push({ row, col });
    }
  }
  // Deterministic shuffle seeded from the board id.
  let s = hashString(boardId) >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }
  return free.slice(0, Math.min(count, free.length)).map((cell, i) => {
    const type = DECOR_TYPES[i % DECOR_TYPES.length];
    return {
      row: cell.row,
      col: cell.col,
      object_id: `decor_${boardId}_${i}`,
      object_type: type,
      label: DECOR_LABELS[type],
    };
  });
}

export function puzzleToBoardData(puzzle: GeneratedPuzzle, opts: PuzzleToBoardOptions = {}): BoardData {
  const rooms = puzzle.rooms.length > 0 ? puzzle.rooms.map(cloneRoom) : rowStripRooms(puzzle.size);
  const boardId = opts.boardId ?? `generated_${puzzle.playMode}_${puzzle.seed}`;
  const occupied = new Set<string>([
    ...puzzle.given.map((g) => `${g.row},${g.col}`),
    ...puzzle.locked.map((c) => `${c.row},${c.col}`),
  ]);

  return {
    board_id: boardId,
    grid_size: { rows: puzzle.size, cols: puzzle.size },
    duck_count: puzzle.size,
    duck_ids: puzzle.duckIds.slice(),
    play_mode: puzzle.playMode,
    blocked_cells: puzzle.locked.map((c) => ({ row: c.row, col: c.col })),
    scene_objects: buildDecorations(boardId, puzzle.size, occupied, opts.decorations ?? 0),
    rooms,
    initial_values: puzzle.given.map((g) => ({
      row: g.row,
      col: g.col,
      duck_id: g.duck_id,
      is_fixed: true,
    })),
    solution: puzzle.solution.map((s) => ({ row: s.row, col: s.col, duck_id: s.duck_id })),
  };
}
