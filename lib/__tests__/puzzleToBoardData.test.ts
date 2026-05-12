/**
 * Tests for lib/puzzleToBoardData.ts.
 *
 * Run: node --test lib/__tests__/puzzleToBoardData.test.ts
 * Also type-checks under `npx tsc --noEmit`.
 *
 * Note: `lib/daily.ts#generateDailyBoard` is intentionally not exercised here.
 * `daily.ts` uses extensionless relative imports (resolved by Metro, not by
 * Node's ESM resolver), so it can't be loaded by this Node-based test. It is
 * thin glue over the functions covered below; `npx tsc --noEmit` type-checks it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle } from '../puzzleGenerator.ts';
import { puzzleToBoardData } from '../puzzleToBoardData.ts';
import { validateBoardDefinition } from '../boardValidator.ts';

test('murdoku puzzle adapts to a board the validator accepts', () => {
  const puzzle = generatePuzzle('case-adapt-murdoku', { size: 6, playMode: 'murdoku' });
  const board = puzzleToBoardData(puzzle);
  const result = validateBoardDefinition(board);
  assert.equal(result.isValid, true, JSON.stringify(result.issues));
  assert.equal(board.play_mode, 'murdoku');
  assert.equal(board.rooms.length, 6); // row-strip fallback
  assert.equal(board.solution.length, 6);
});

test('murdoku puzzle with locked cells produces matching blocked_cells, solution avoids them', () => {
  const locked = [
    { row: 0, col: 0 },
    { row: 3, col: 4 },
  ];
  const puzzle = generatePuzzle('case-adapt-locked', { size: 6, playMode: 'murdoku', lockedCells: locked });
  const board = puzzleToBoardData(puzzle);
  assert.deepEqual(board.blocked_cells, locked);
  const blockedKeys = new Set(locked.map((c) => `${c.row},${c.col}`));
  for (const s of board.solution) assert.ok(!blockedKeys.has(`${s.row},${s.col}`));
  assert.equal(validateBoardDefinition(board).isValid, true);
});

test('latin puzzle adapts to a board the validator accepts (regions preserved)', () => {
  const puzzle = generatePuzzle('case-adapt-latin', { size: 6, playMode: 'latin' });
  const board = puzzleToBoardData(puzzle);
  const result = validateBoardDefinition(board);
  assert.equal(result.isValid, true, JSON.stringify(result.issues));
  assert.equal(board.play_mode, 'latin');
  assert.equal(board.rooms.length, 6);
  assert.equal(board.solution.length, 36);
  // initial values are a strict subset of the solution
  const solByCell = new Map(board.solution.map((s) => [`${s.row},${s.col}`, s.duck_id]));
  for (const iv of board.initial_values) {
    assert.equal(solByCell.get(`${iv.row},${iv.col}`), iv.duck_id);
    assert.equal(iv.is_fixed, true);
  }
  assert.ok(board.initial_values.length < 36);
});

test('prime-sized latin puzzle (jigsaw) adapts and validates', () => {
  const puzzle = generatePuzzle('case-adapt-prime', { size: 5, playMode: 'latin' });
  const board = puzzleToBoardData(puzzle);
  assert.equal(board.rooms.length, 5);
  assert.equal(validateBoardDefinition(board).isValid, true);
});

test('latin puzzle forced to plain (regionStyle box on prime) uses row-strip fallback', () => {
  const puzzle = generatePuzzle('case-adapt-rowstrip', { size: 5, playMode: 'latin', regionStyle: 'box' });
  assert.equal(puzzle.rooms.length, 0); // generator produced no regions
  const board = puzzleToBoardData(puzzle);
  assert.equal(board.rooms.length, 5); // adapter fell back to one room per row
  assert.equal(validateBoardDefinition(board).isValid, true);
});

test('a "daily-like" generated board is deterministic per seed and validates', () => {
  // Mirrors lib/daily.ts#generateDailyBoard without importing it (see header note).
  const make = (key: string) =>
    puzzleToBoardData(generatePuzzle(`daily-${key}`, { size: 6, playMode: 'murdoku', difficulty: 'medium' }), {
      boardId: `daily_${key}`,
    });
  const a = make('2026-06-01');
  const b = make('2026-06-01');
  assert.deepEqual(a, b);
  assert.equal(a.board_id, 'daily_2026-06-01');
  assert.equal(validateBoardDefinition(a).isValid, true);
  assert.notDeepEqual(a.solution, make('2026-06-02').solution);
});

test('puzzleToBoardData honours a custom boardId', () => {
  const puzzle = generatePuzzle('case-adapt-id', { size: 6, playMode: 'murdoku' });
  const board = puzzleToBoardData(puzzle, { boardId: 'my_board_42' });
  assert.equal(board.board_id, 'my_board_42');
});

test('decorations: deterministic, on empty cells, board still validates', () => {
  const puzzle = generatePuzzle('case-decor', { size: 6, playMode: 'latin' });
  const a = puzzleToBoardData(puzzle, { boardId: 'decor_board', decorations: 7 });
  const b = puzzleToBoardData(puzzle, { boardId: 'decor_board', decorations: 7 });
  assert.deepEqual(a.scene_objects, b.scene_objects);
  assert.equal(a.scene_objects?.length, 7);
  const givenKeys = new Set((a.initial_values ?? []).map((iv) => `${iv.row},${iv.col}`));
  const decorKeys = new Set<string>();
  for (const obj of a.scene_objects ?? []) {
    const k = `${obj.row},${obj.col}`;
    assert.ok(!givenKeys.has(k), 'decoration not on a given cell');
    assert.ok(!decorKeys.has(k), 'no duplicate decoration cell');
    decorKeys.add(k);
  }
  assert.equal(validateBoardDefinition(a).isValid, true, JSON.stringify(validateBoardDefinition(a).issues));
});
