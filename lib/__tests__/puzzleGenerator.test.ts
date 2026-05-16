/**
 * Tests for lib/puzzleGenerator.ts.
 *
 * No test runner is wired into this project, so this file uses Node's built-in
 * `node:test` + `node:assert/strict`. It is plain enough to run directly with
 * Node's TypeScript stripping (Node >= 23):
 *
 *   node --test lib/__tests__/puzzleGenerator.test.ts
 *
 * (or `node lib/__tests__/puzzleGenerator.test.ts`). It also type-checks under
 * `npx tsc --noEmit`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePuzzle,
  countLatinSolutions,
  countMurdokuLayouts,
  boxDimsForSize,
  type GeneratedPuzzle,
} from '../puzzleGenerator.ts';

function gridFromSolution(p: GeneratedPuzzle): number[][] {
  const idx = new Map(p.duckIds.map((d, i) => [d, i]));
  const g = Array.from({ length: p.size }, () => new Array<number>(p.size).fill(-1));
  for (const cell of p.solution) g[cell.row][cell.col] = idx.get(cell.duck_id)!;
  return g;
}

function gridFromGiven(p: GeneratedPuzzle): number[][] {
  const idx = new Map(p.duckIds.map((d, i) => [d, i]));
  const g = Array.from({ length: p.size }, () => new Array<number>(p.size).fill(-1));
  for (const cell of p.given) g[cell.row][cell.col] = idx.get(cell.duck_id)!;
  return g;
}

function regionGrid(p: GeneratedPuzzle): number[][] | null {
  if (p.rooms.length === 0) return null;
  const g = Array.from({ length: p.size }, () => new Array<number>(p.size).fill(-1));
  p.rooms.forEach((room, i) => {
    for (const c of room.cells) g[c.row][c.col] = i;
  });
  return g;
}

function isRegionContiguous(regions: number[][], n: number, regionId: number): boolean {
  const cells: [number, number][] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === regionId) cells.push([r, c]);
  if (cells.length === 0) return false;
  const seen = new Set<string>([`${cells[0][0]},${cells[0][1]}`]);
  const stack = [cells[0]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      if (regions[nr][nc] !== regionId) continue;
      const k = `${nr},${nc}`;
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push([nr, nc]);
    }
  }
  return seen.size === cells.length;
}

test('latin: solution is a valid Latin square with valid jigsaw regions', () => {
  const p = generatePuzzle('case-latin-1', { size: 6, playMode: 'latin' });
  const g = gridFromSolution(p);
  const regions = regionGrid(p);
  assert.equal(p.solution.length, 36);
  assert.equal(p.rooms.length, 6, 'jigsaw default => 6 named areas');
  // rows and columns contain 0..5 exactly once
  for (let i = 0; i < 6; i++) {
    assert.deepEqual([...g[i]].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(g.map((r) => r[i]).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
  }
  // each region: exactly 6 cells, contiguous, contains 0..5 exactly once
  assert.ok(regions);
  const buckets = Array.from({ length: 6 }, () => [] as number[]);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) buckets[regions![r][c]].push(g[r][c]);
  for (let id = 0; id < 6; id++) {
    assert.equal(buckets[id].length, 6, `region ${id} has 6 cells`);
    assert.deepEqual(buckets[id].slice().sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
    assert.ok(isRegionContiguous(regions!, 6, id), `region ${id} is contiguous`);
  }
});

test('latin: regionStyle "box" produces rectangular boxes', () => {
  const p = generatePuzzle('case-box', { size: 6, playMode: 'latin', regionStyle: 'box' });
  assert.equal(p.rooms.length, 6);
  // box 2x3: cell (0,0) and (0,2) share a region; (0,0) and (2,0) don't
  const idx = (cell: { row: number; col: number }) => p.rooms.findIndex((rm) => rm.cells.some((c) => c.row === cell.row && c.col === cell.col));
  assert.equal(idx({ row: 0, col: 0 }), idx({ row: 0, col: 2 }));
  assert.notEqual(idx({ row: 0, col: 0 }), idx({ row: 2, col: 0 }));
});

test('latin: custom roomNames are used', () => {
  const names = ['Cocina', 'Salón', 'Jardín', 'Sótano', 'Ático', 'Garaje'];
  const p = generatePuzzle('case-names', { size: 6, playMode: 'latin', roomNames: names });
  assert.deepEqual(p.rooms.map((r) => r.room_name).slice().sort(), names.slice().sort());
});

test('latin: given clues are a subset of the solution and yield a unique solution', () => {
  const p = generatePuzzle('case-latin-2', { size: 6, playMode: 'latin', difficulty: 'medium' });
  const solGrid = gridFromSolution(p);
  for (const cell of p.given) {
    const idx = p.duckIds.indexOf(cell.duck_id);
    assert.equal(solGrid[cell.row][cell.col], idx, 'given cell must match solution');
    assert.equal(cell.is_fixed, true);
  }
  assert.ok(p.given.length < 36, 'puzzle must actually remove some cells');
  const puzzleGrid = gridFromGiven(p);
  assert.equal(countLatinSolutions(puzzleGrid, 6, regionGrid(p), 2), 1, 'must be uniquely solvable');
});

test('latin: difficulty changes the number of revealed cells', () => {
  const easy = generatePuzzle('case-diff', { size: 6, playMode: 'latin', difficulty: 'easy' });
  const hard = generatePuzzle('case-diff', { size: 6, playMode: 'latin', difficulty: 'hard' });
  assert.ok(easy.given.length > hard.given.length, `easy(${easy.given.length}) should reveal more than hard(${hard.given.length})`);
});

test('latin: prime sizes get jigsaw regions and stay uniquely solvable', () => {
  const p = generatePuzzle('case-prime', { size: 5, playMode: 'latin' });
  assert.equal(p.rooms.length, 5);
  for (let id = 0; id < 5; id++) assert.equal(p.rooms[id].cells.length, 5);
  assert.equal(countLatinSolutions(gridFromGiven(p), 5, regionGrid(p), 2), 1);
});

test('latin: regionStyle "box" on a prime size falls back to plain Latin (no regions)', () => {
  const p = generatePuzzle('case-prime-box', { size: 5, playMode: 'latin', regionStyle: 'box' });
  assert.equal(p.rooms.length, 0);
  assert.equal(countLatinSolutions(gridFromGiven(p), 5, null, 2), 1);
});

test('determinism: same seed + options => identical puzzle', () => {
  const a = generatePuzzle('repeat-me', { size: 6, playMode: 'latin', difficulty: 'medium' });
  const b = generatePuzzle('repeat-me', { size: 6, playMode: 'latin', difficulty: 'medium' });
  assert.deepEqual(a, b);
  const c = generatePuzzle('different-seed', { size: 6, playMode: 'latin', difficulty: 'medium' });
  assert.notDeepEqual(a.solution, c.solution);
});

test('murdoku: solution is a permutation matrix with one duck per row/column', () => {
  const p = generatePuzzle('case-murdoku-1', { size: 6, playMode: 'murdoku' });
  assert.equal(p.solution.length, 6);
  assert.equal(new Set(p.solution.map((c) => c.row)).size, 6);
  assert.equal(new Set(p.solution.map((c) => c.col)).size, 6);
  assert.equal(new Set(p.solution.map((c) => c.duck_id)).size, 6);
  for (const d of p.duckIds) assert.ok(p.solution.some((c) => c.duck_id === d));
});

test('murdoku: respects locked cells', () => {
  const locked = [
    { row: 0, col: 0 },
    { row: 2, col: 3 },
    { row: 5, col: 5 },
  ];
  const p = generatePuzzle('case-murdoku-locked', { size: 6, playMode: 'murdoku', lockedCells: locked });
  assert.deepEqual(p.locked, locked);
  const lockedKeys = new Set(locked.map((c) => `${c.row},${c.col}`));
  for (const cell of p.solution) assert.ok(!lockedKeys.has(`${cell.row},${cell.col}`));
});

test('murdoku: given cells match the solution and are fixed', () => {
  const p = generatePuzzle('case-murdoku-given', { size: 6, playMode: 'murdoku', difficulty: 'easy' });
  const byCell = new Map(p.solution.map((c) => [`${c.row},${c.col}`, c.duck_id]));
  assert.ok(p.given.length >= 1);
  for (const cell of p.given) {
    assert.equal(byCell.get(`${cell.row},${cell.col}`), cell.duck_id);
    assert.equal(cell.is_fixed, true);
  }
});

test('countMurdokuLayouts: fully fixed layout is unique, empty board is ambiguous', () => {
  const ducks = ['a', 'b', 'c'];
  const fixedFull = [
    { row: 0, col: 1, duck_id: 'a' },
    { row: 1, col: 2, duck_id: 'b' },
    { row: 2, col: 0, duck_id: 'c' },
  ];
  assert.equal(countMurdokuLayouts(3, ducks, fixedFull, [], 2), 1);
  assert.equal(countMurdokuLayouts(3, ducks, [], [], 2), 2); // capped at limit
  // contradictory fixed cells (two ducks in the same column) => 0
  assert.equal(
    countMurdokuLayouts(3, ducks, [
      { row: 0, col: 0, duck_id: 'a' },
      { row: 1, col: 0, duck_id: 'b' },
    ], [], 2),
    0,
  );
});

test('boxDimsForSize: known splits', () => {
  assert.deepEqual(boxDimsForSize(6), { boxRows: 2, boxCols: 3 });
  assert.deepEqual(boxDimsForSize(9), { boxRows: 3, boxCols: 3 });
  assert.deepEqual(boxDimsForSize(4), { boxRows: 2, boxCols: 2 });
  assert.equal(boxDimsForSize(5), null);
  assert.equal(boxDimsForSize(7), null);
});
