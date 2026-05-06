import type { BoardData, Room } from '../constants/cases';

export type CellState = {
  duck_id: string | null;
  is_fixed: boolean;
  is_correct: boolean | null; // null = not yet placed
  x_mark: boolean;
  notes: string[]; // candidate duck_ids
};

export type BoardState = CellState[][];

export interface BoardDefinitionIssue {
  code: string;
  message: string;
}

export interface BoardDefinitionValidation {
  isValid: boolean;
  issues: BoardDefinitionIssue[];
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function isInBounds(board: BoardData, row: number, col: number): boolean {
  return row >= 0 && row < board.grid_size.rows && col >= 0 && col < board.grid_size.cols;
}

function areCellsContiguous(cells: { row: number; col: number }[]): boolean {
  if (cells.length === 0) return false;

  const remaining = new Set(cells.map((cell) => cellKey(cell.row, cell.col)));
  const stack = [cells[0]];
  remaining.delete(cellKey(cells[0].row, cells[0].col));

  while (stack.length > 0) {
    const cell = stack.pop();
    if (!cell) continue;

    for (const [row, col] of [
      [cell.row - 1, cell.col],
      [cell.row + 1, cell.col],
      [cell.row, cell.col - 1],
      [cell.row, cell.col + 1],
    ]) {
      const key = cellKey(row, col);
      if (remaining.has(key)) {
        remaining.delete(key);
        stack.push({ row, col });
      }
    }
  }

  return remaining.size === 0;
}

function hasEveryDuckOnce(values: string[], duckIds: string[]): boolean {
  if (values.length !== duckIds.length) return false;
  const expected = new Set(duckIds);
  const found = new Set(values);
  if (found.size !== expected.size) return false;
  return [...expected].every((duckId) => found.has(duckId));
}

export function getBoardPlayMode(board: BoardData): NonNullable<BoardData['play_mode']> {
  return board.play_mode ?? 'latin';
}

export function getCellKey(row: number, col: number): string {
  return cellKey(row, col);
}

export function getBlockedCellKeys(board: BoardData): string[] {
  return (board.blocked_cells ?? []).map((cell) => cellKey(cell.row, cell.col));
}

export function isCellBlocked(board: BoardData, row: number, col: number): boolean {
  return (board.blocked_cells ?? []).some((cell) => cell.row === row && cell.col === col);
}

export function getDuckTargetPlacementCount(board: BoardData, duck_id: string): number {
  if (getBoardPlayMode(board) === 'murdoku') return 1;

  const solutionCount = board.solution.filter((cell) => cell.duck_id === duck_id).length;
  return solutionCount || board.duck_count;
}

export function validateBoardDefinition(board: BoardData): BoardDefinitionValidation {
  const issues: BoardDefinitionIssue[] = [];
  const duckIds = board.duck_ids;
  const expectedCellCount = board.grid_size.rows * board.grid_size.cols;
  const playMode = getBoardPlayMode(board);

  if (duckIds.length !== board.duck_count) {
    issues.push({
      code: 'duck-count-mismatch',
      message: `duck_count is ${board.duck_count}, but duck_ids has ${duckIds.length} entries.`,
    });
  }

  const expectedSolutionCount = playMode === 'murdoku' ? duckIds.length : expectedCellCount;
  if (board.solution.length !== expectedSolutionCount) {
    issues.push({
      code: 'solution-size',
      message: `Solution has ${board.solution.length} cells, expected ${expectedSolutionCount}.`,
    });
  }

  const solutionLookup: Record<string, string> = {};
  const solutionRows = new Set<number>();
  const solutionCols = new Set<number>();
  const solutionDucks = new Set<string>();

  for (const blocked of board.blocked_cells ?? []) {
    const key = cellKey(blocked.row, blocked.col);
    if (!isInBounds(board, blocked.row, blocked.col)) {
      issues.push({ code: 'blocked-out-of-bounds', message: `Blocked cell ${key} is outside the grid.` });
    }
  }

  const sceneObjectCells = new Set<string>();
  for (const object of board.scene_objects ?? []) {
    const key = cellKey(object.row, object.col);
    if (!isInBounds(board, object.row, object.col)) {
      issues.push({ code: 'scene-object-out-of-bounds', message: `${object.object_id} is outside the grid at ${key}.` });
    }
    if (sceneObjectCells.has(key)) {
      issues.push({ code: 'duplicate-scene-object-cell', message: `More than one scene object is placed at ${key}.` });
    }
    sceneObjectCells.add(key);
  }

  for (const sol of board.solution) {
    const key = cellKey(sol.row, sol.col);
    if (!isInBounds(board, sol.row, sol.col)) {
      issues.push({ code: 'solution-out-of-bounds', message: `Solution cell ${key} is outside the grid.` });
      continue;
    }
    if (isCellBlocked(board, sol.row, sol.col)) {
      issues.push({ code: 'solution-blocked-cell', message: `Solution cell ${key} is blocked.` });
    }
    if (!duckIds.includes(sol.duck_id)) {
      issues.push({ code: 'unknown-solution-duck', message: `Solution cell ${key} uses unknown duck ${sol.duck_id}.` });
    }
    if (solutionLookup[key]) {
      issues.push({ code: 'duplicate-solution-cell', message: `Solution defines cell ${key} more than once.` });
    }
    if (playMode === 'murdoku') {
      if (solutionRows.has(sol.row)) {
        issues.push({ code: 'duplicate-solution-row', message: `Murdoku solution has more than one suspect in row ${sol.row}.` });
      }
      if (solutionCols.has(sol.col)) {
        issues.push({ code: 'duplicate-solution-column', message: `Murdoku solution has more than one suspect in column ${sol.col}.` });
      }
      if (solutionDucks.has(sol.duck_id)) {
        issues.push({ code: 'duplicate-solution-duck', message: `Murdoku solution places ${sol.duck_id} more than once.` });
      }
      solutionRows.add(sol.row);
      solutionCols.add(sol.col);
      solutionDucks.add(sol.duck_id);
    }
    solutionLookup[key] = sol.duck_id;
  }

  if (playMode === 'murdoku') {
    for (const duckId of duckIds) {
      if (!solutionDucks.has(duckId)) {
        issues.push({ code: 'missing-solution-duck', message: `Murdoku solution does not place ${duckId}.` });
      }
    }
  } else {
    for (let row = 0; row < board.grid_size.rows; row++) {
      const rowValues = Array.from({ length: board.grid_size.cols }, (_, col) => solutionLookup[cellKey(row, col)]);
      if (!hasEveryDuckOnce(rowValues, duckIds)) {
        issues.push({ code: 'invalid-solution-row', message: `Row ${row} does not contain every duck exactly once.` });
      }
    }

    for (let col = 0; col < board.grid_size.cols; col++) {
      const colValues = Array.from({ length: board.grid_size.rows }, (_, row) => solutionLookup[cellKey(row, col)]);
      if (!hasEveryDuckOnce(colValues, duckIds)) {
        issues.push({ code: 'invalid-solution-column', message: `Column ${col} does not contain every duck exactly once.` });
      }
    }
  }

  const roomCellOwners: Record<string, string> = {};
  for (const room of board.rooms) {
    if (playMode === 'latin' && room.cells.length !== board.duck_count) {
      issues.push({
        code: 'room-size',
        message: `${room.room_name} has ${room.cells.length} cells, expected ${board.duck_count}.`,
      });
    }

    if (!areCellsContiguous(room.cells)) {
      issues.push({ code: 'room-not-contiguous', message: `${room.room_name} is not contiguous by cell sides.` });
    }

    const roomValues: string[] = [];
    for (const cell of room.cells) {
      const key = cellKey(cell.row, cell.col);
      if (!isInBounds(board, cell.row, cell.col)) {
        issues.push({ code: 'room-out-of-bounds', message: `${room.room_name} contains out-of-bounds cell ${key}.` });
        continue;
      }
      if (roomCellOwners[key]) {
        issues.push({
          code: 'duplicate-room-cell',
          message: `Cell ${key} belongs to both ${roomCellOwners[key]} and ${room.room_name}.`,
        });
      }
      roomCellOwners[key] = room.room_name;
      roomValues.push(solutionLookup[key]);
    }

    if (playMode === 'latin' && !hasEveryDuckOnce(roomValues, duckIds)) {
      issues.push({ code: 'invalid-solution-room', message: `${room.room_name} does not contain every duck exactly once.` });
    }
  }

  if (Object.keys(roomCellOwners).length !== expectedCellCount) {
    issues.push({
      code: 'room-coverage',
      message: `Rooms cover ${Object.keys(roomCellOwners).length} cells, expected ${expectedCellCount}.`,
    });
  }

  for (const iv of board.initial_values) {
    const key = cellKey(iv.row, iv.col);
    if (!isInBounds(board, iv.row, iv.col)) {
      issues.push({ code: 'initial-out-of-bounds', message: `Initial value ${key} is outside the grid.` });
      continue;
    }
    if (isCellBlocked(board, iv.row, iv.col)) {
      issues.push({ code: 'initial-blocked-cell', message: `Initial value ${key} is on a blocked cell.` });
      continue;
    }
    if (solutionLookup[key] !== iv.duck_id) {
      issues.push({ code: 'initial-mismatch', message: `Initial value ${key} does not match the solution.` });
    }
  }

  return { isValid: issues.length === 0, issues };
}

/** Build initial board state from BoardData */
export function buildInitialBoardState(board: BoardData): BoardState {
  const state: BoardState = Array.from({ length: board.grid_size.rows }, () =>
    Array.from({ length: board.grid_size.cols }, () => ({
      duck_id: null,
      is_fixed: false,
      is_correct: null,
      x_mark: false,
      notes: [],
    }))
  );

  for (const iv of board.initial_values) {
    state[iv.row][iv.col] = {
      duck_id: iv.duck_id,
      is_fixed: iv.is_fixed,
      is_correct: true, // fixed cells are always correct
      x_mark: false,
      notes: [],
    };
  }

  return state;
}

/** Get the room a cell belongs to */
export function getCellRoom(board: BoardData, row: number, col: number): Room | null {
  for (const room of board.rooms) {
    if (room.cells.some((c) => c.row === row && c.col === col)) {
      return room;
    }
  }
  return null;
}

/** Build a lookup: (row,col) → room_id */
export function buildRoomLookup(board: BoardData): Record<string, string> {
  const lookup: Record<string, string> = {};
  for (const room of board.rooms) {
    for (const cell of room.cells) {
      lookup[`${cell.row},${cell.col}`] = room.room_id;
    }
  }
  return lookup;
}

export type ConflictType = 'row' | 'col' | 'room' | 'duck' | 'blocked' | 'xmark' | 'solution';

export interface ValidationResult {
  isValid: boolean;
  conflicts: ConflictType[];
}

/**
 * Validate placing duck_id at (row, col) against current board state.
 * Returns conflicts found (if any).
 */
export function validatePlacement(
  board: BoardData,
  state: BoardState,
  row: number,
  col: number,
  duck_id: string
): ValidationResult {
  const conflicts: ConflictType[] = [];
  const playMode = getBoardPlayMode(board);

  if (!isInBounds(board, row, col) || isCellBlocked(board, row, col)) {
    conflicts.push('blocked');
    return { isValid: false, conflicts };
  }

  if (state[row][col].x_mark) {
    conflicts.push('xmark');
    return { isValid: false, conflicts };
  }

  // Check row
  for (let c = 0; c < board.grid_size.cols; c++) {
    if (c === col) continue;
    const placedDuckId = state[row][c].duck_id;
    const hasConflict = playMode === 'murdoku' ? placedDuckId !== null : placedDuckId === duck_id;
    if (hasConflict) {
      conflicts.push('row');
      break;
    }
  }

  // Check column
  for (let r = 0; r < board.grid_size.rows; r++) {
    if (r === row) continue;
    const placedDuckId = state[r][col].duck_id;
    const hasConflict = playMode === 'murdoku' ? placedDuckId !== null : placedDuckId === duck_id;
    if (hasConflict) {
      conflicts.push('col');
      break;
    }
  }

  if (playMode === 'murdoku') {
    for (let r = 0; r < board.grid_size.rows; r++) {
      for (let c = 0; c < board.grid_size.cols; c++) {
        if (r === row && c === col) continue;
        if (state[r][c].duck_id === duck_id) {
          conflicts.push('duck');
          return { isValid: false, conflicts };
        }
      }
    }

    return { isValid: conflicts.length === 0, conflicts };
  }

  // Check room
  const room = getCellRoom(board, row, col);
  if (room) {
    for (const cell of room.cells) {
      if (cell.row === row && cell.col === col) continue;
      if (state[cell.row][cell.col].duck_id === duck_id) {
        conflicts.push('room');
        break;
      }
    }
  }

  return { isValid: conflicts.length === 0, conflicts };
}

export function getConflictCellKeys(
  board: BoardData,
  state: BoardState,
  row: number,
  col: number,
  duck_id: string,
  conflicts: ConflictType[]
): string[] {
  const keys = new Set<string>([cellKey(row, col)]);
  const playMode = getBoardPlayMode(board);

  if (conflicts.includes('blocked') || conflicts.includes('xmark') || conflicts.includes('solution')) {
    return [...keys];
  }

  if (conflicts.includes('row')) {
    for (let c = 0; c < board.grid_size.cols; c++) {
      const placedDuckId = state[row][c].duck_id;
      if (playMode === 'murdoku' ? placedDuckId !== null : placedDuckId === duck_id) {
        keys.add(cellKey(row, c));
      }
    }
  }

  if (conflicts.includes('col')) {
    for (let r = 0; r < board.grid_size.rows; r++) {
      const placedDuckId = state[r][col].duck_id;
      if (playMode === 'murdoku' ? placedDuckId !== null : placedDuckId === duck_id) {
        keys.add(cellKey(r, col));
      }
    }
  }

  if (conflicts.includes('duck')) {
    for (let r = 0; r < board.grid_size.rows; r++) {
      for (let c = 0; c < board.grid_size.cols; c++) {
        if (state[r][c].duck_id === duck_id) keys.add(cellKey(r, c));
      }
    }
  }

  if (conflicts.includes('room')) {
    const room = getCellRoom(board, row, col);
    if (room) {
      for (const cell of room.cells) {
        if (state[cell.row][cell.col].duck_id === duck_id) {
          keys.add(cellKey(cell.row, cell.col));
        }
      }
    }
  }

  return [...keys];
}

export function getRoomCellKeys(board: BoardData, row: number, col: number): string[] {
  const room = getCellRoom(board, row, col);
  return room?.cells.map((cell) => cellKey(cell.row, cell.col)) ?? [cellKey(row, col)];
}

export function getUnavailableCellKeysForDuck(
  board: BoardData,
  state: BoardState,
  duck_id: string | null
): string[] {
  const unavailable = new Set<string>(getBlockedCellKeys(board));
  const blockedRows = new Set<number>();
  const blockedCols = new Set<number>();
  const blockedRooms = new Set<string>();
  const roomLookup = buildRoomLookup(board);
  const playMode = getBoardPlayMode(board);

  for (let row = 0; row < board.grid_size.rows; row++) {
    for (let col = 0; col < board.grid_size.cols; col++) {
      const cell = state[row]?.[col];
      const key = cellKey(row, col);
      if (!cell) continue;

      if (playMode === 'murdoku') {
        if (cell.duck_id) {
          unavailable.add(key);
          if (duck_id && cell.duck_id !== duck_id) {
            blockedRows.add(row);
            blockedCols.add(col);
          }
        }
        continue;
      }

      if (cell.duck_id) unavailable.add(key);

      if (duck_id && cell.duck_id === duck_id) {
        blockedRows.add(row);
        blockedCols.add(col);
        const roomId = roomLookup[key];
        if (roomId) blockedRooms.add(roomId);
      }
    }
  }

  for (let row = 0; row < board.grid_size.rows; row++) {
    for (let col = 0; col < board.grid_size.cols; col++) {
      const key = cellKey(row, col);
      const roomId = roomLookup[key];
      const roomBlocked = playMode === 'latin' && roomId && blockedRooms.has(roomId);
      if (blockedRows.has(row) || blockedCols.has(col) || roomBlocked) {
        unavailable.add(key);
      }
    }
  }

  return [...unavailable];
}

export function findFirstEmptyEditableCell(
  board: BoardData,
  state: BoardState
): { row: number; col: number } | null {
  for (let row = 0; row < board.grid_size.rows; row++) {
    for (let col = 0; col < board.grid_size.cols; col++) {
      const cell = state[row]?.[col];
      if (cell && !cell.duck_id && !cell.is_fixed && !isCellBlocked(board, row, col)) {
        return { row, col };
      }
    }
  }

  return null;
}

/**
 * Check if a placement matches the solution.
 */
export function checkSolution(
  board: BoardData,
  row: number,
  col: number,
  duck_id: string
): boolean {
  const solutionCell = board.solution.find((s) => s.row === row && s.col === col);
  return solutionCell?.duck_id === duck_id;
}

/**
 * Check if the board is fully and correctly completed.
 */
export function isBoardComplete(board: BoardData, state: BoardState): boolean {
  if (getBoardPlayMode(board) === 'murdoku') {
    if (countTotalPlacements(state) !== board.solution.length) return false;
  }

  for (const sol of board.solution) {
    if (state[sol.row][sol.col].duck_id !== sol.duck_id) return false;
  }
  return true;
}

export function isBoardReadyToSubmit(board: BoardData, state: BoardState): boolean {
  return board.duck_ids.every((duckId) => countDuckPlacements(state, duckId) >= getDuckTargetPlacementCount(board, duckId));
}

export function getSolutionMismatchCellKeys(board: BoardData, state: BoardState): string[] {
  const keys = new Set<string>();
  const solutionByDuck = new Map(board.solution.map((cell) => [cell.duck_id, cell]));

  for (let row = 0; row < board.grid_size.rows; row++) {
    for (let col = 0; col < board.grid_size.cols; col++) {
      const placedDuckId = state[row]?.[col]?.duck_id;
      if (!placedDuckId) continue;

      const solutionCell = solutionByDuck.get(placedDuckId);
      if (!solutionCell || solutionCell.row !== row || solutionCell.col !== col) {
        keys.add(cellKey(row, col));
      }
    }
  }

  for (const sol of board.solution) {
    if (state[sol.row][sol.col].duck_id !== sol.duck_id) {
      keys.add(cellKey(sol.row, sol.col));
    }
  }

  return [...keys];
}

export function findFirstUnsolvedSolutionCell(
  board: BoardData,
  state: BoardState
): { row: number; col: number; duck_id: string } | null {
  for (const sol of board.solution) {
    if (state[sol.row]?.[sol.col]?.duck_id !== sol.duck_id) {
      return sol;
    }
  }

  return null;
}

/**
 * Count how many ducks of duck_id are placed on the board.
 */
export function countDuckPlacements(state: BoardState, duck_id: string): number {
  let count = 0;
  for (const row of state) {
    for (const cell of row) {
      if (cell.duck_id === duck_id) count++;
    }
  }
  return count;
}

export function countTotalPlacements(state: BoardState): number {
  let count = 0;
  for (const row of state) {
    for (const cell of row) {
      if (cell.duck_id) count++;
    }
  }
  return count;
}
