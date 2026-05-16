/**
 * Deterministic puzzle generator for QuackDoku.
 *
 * Two play modes (mirrors `constants/cases.ts` / `lib/boardValidator.ts`):
 *
 *  - `latin`  : full Latin square. Every duck appears exactly once per row,
 *               per column and (when the grid size factors into a box) per
 *               rectangular region. This is the classic "sudoku logic" mode
 *               and the generated puzzle is guaranteed to have a UNIQUE
 *               solution reachable from the given clues alone.
 *
 *  - `murdoku`: N suspects on an N x N grid, each placed exactly once, with no
 *               two suspects sharing a row or a column (a permutation matrix).
 *               The grid constraint alone does NOT determine a unique layout —
 *               in the real game the narrative / suspect clues do that. So for
 *               murdoku this module only produces a valid random solution plus
 *               a handful of `is_fixed` seed cells; the caller is expected to
 *               attach clues. `countMurdokuLayouts` is exported so callers can
 *               measure how ambiguous a clue set still is.
 *
 * Determinism: same `seed` (and same options) -> same puzzle. The RNG is a
 * small self-contained mulberry32 seeded from an FNV-1a hash of the seed
 * string, so results are stable across platforms and Node versions.
 */

import type {
  BoardCell,
  BoardPlayMode,
  InitialValue,
  Room,
  SolutionCell,
} from '../constants/cases';

export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface GeneratePuzzleOptions {
  /** Grid dimension N (rows === cols). Default 6. */
  size?: number;
  /** Duck ids to use; must contain at least `size` entries. Default `duck_1..duck_N`. */
  duckIds?: string[];
  /** Play mode. Default `murdoku` (matches the current game). */
  playMode?: BoardPlayMode;
  /** Difficulty bucket controlling how many cells are revealed. Default `medium`. */
  difficulty?: PuzzleDifficulty;
  /**
   * Latin mode only: shape of the regions.
   *  - `jigsaw` (default): irregular contiguous "areas" like real Murdoku.
   *  - `box`: rectangular boxes (classic sudoku); requires N to factor, falls
   *    back to no regions for prime N.
   * Passing `boxRows`/`boxCols` implies `box`.
   */
  regionStyle?: 'jigsaw' | 'box';
  /** Latin mode only: names for the regions (length must be `size`). Defaults to `Área 1..N`. */
  roomNames?: string[];
  /** Latin mode + `box` style only: region height. Defaults to the factor of N closest to sqrt(N). */
  boxRows?: number;
  /** Latin mode + `box` style only: region width. Defaults to N / boxRows. */
  boxCols?: number;
  /** Murdoku mode only: cells the generator must keep empty (blocked scenery). */
  lockedCells?: BoardCell[];
  /** Safety cap on internal retries. Default 200. */
  maxAttempts?: number;
}

export interface GeneratedPuzzle {
  seed: string;
  size: number;
  playMode: BoardPlayMode;
  difficulty: PuzzleDifficulty;
  duckIds: string[];
  /** Full solution. `latin`: N*N cells. `murdoku`: N cells. */
  solution: SolutionCell[];
  /** Revealed cells (subset of `solution`), all with `is_fixed: true`. */
  given: InitialValue[];
  /** Blocked cells (only ever non-empty for murdoku when `lockedCells` is passed). */
  locked: BoardCell[];
  /** Rectangular regions for `latin` mode; empty for `murdoku`. */
  rooms: Room[];
}

// ─── RNG ─────────────────────────────────────────────────────────────────────

function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Returns a deterministic float in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed: string): () => number {
  return mulberry32(hashSeed(seed));
}

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rangeIndices(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

// ─── Shared config ───────────────────────────────────────────────────────────

const DIFFICULTY_GIVEN_RATIO: Record<PuzzleDifficulty, number> = {
  easy: 0.42,
  medium: 0.32,
  hard: 0.22,
};

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

function defaultDuckIds(size: number): string[] {
  return Array.from({ length: size }, (_, i) => `duck_${i + 1}`);
}

function resolveDuckIds(size: number, provided?: string[]): string[] {
  if (!provided) return defaultDuckIds(size);
  if (provided.length < size) {
    throw new Error(`duckIds needs at least ${size} entries, got ${provided.length}`);
  }
  if (new Set(provided).size !== provided.length) {
    throw new Error('duckIds must be unique');
  }
  return provided.slice(0, size);
}

function targetGivenCount(totalCells: number, difficulty: PuzzleDifficulty, size: number): number {
  // Never reveal fewer than one per row on average, never more than all but two.
  const raw = Math.round(totalCells * DIFFICULTY_GIVEN_RATIO[difficulty]);
  return Math.max(size, Math.min(totalCells - 2, raw));
}

// ─── Box / region dimensions ─────────────────────────────────────────────────

/** Best (rows, cols) box split for an N x N grid, or null when N is prime. */
export function boxDimsForSize(n: number): { boxRows: number; boxCols: number } | null {
  let best: { boxRows: number; boxCols: number } | null = null;
  for (let r = 2; r <= n - 1; r++) {
    if (n % r !== 0) continue;
    const c = n / r;
    if (r > c) break; // mirror of an already-seen split
    const candidate = { boxRows: r, boxCols: c };
    if (!best || c - r < best.boxCols - best.boxRows) best = candidate;
  }
  return best;
}

function buildRooms(n: number, boxRows: number, boxCols: number): Room[] {
  const regionsPerRow = n / boxCols;
  const rooms: Room[] = Array.from({ length: n }, (_, idx) => ({
    room_id: `region_${idx + 1}`,
    room_name: `Sala ${idx + 1}`,
    room_color: ROOM_PALETTE[idx % ROOM_PALETTE.length],
    cells: [] as BoardCell[],
  }));
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const regionIndex = Math.floor(row / boxRows) * regionsPerRow + Math.floor(col / boxCols);
      rooms[regionIndex].cells.push({ row, col });
    }
  }
  return rooms;
}

function regionIndexGrid(n: number, boxRows: number, boxCols: number): number[][] {
  const regionsPerRow = n / boxCols;
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) =>
      Math.floor(row / boxRows) * regionsPerRow + Math.floor(col / boxCols),
    ),
  );
}

/**
 * Partitions an N x N grid into N contiguous regions of N cells each (a
 * "jigsaw"/squiggly sudoku layout). Returns a region-index grid, or null if it
 * couldn't (caller should retry with a fresh RNG or fall back to boxes).
 * Strategy: seed one cell per region, then repeatedly grow the smallest
 * not-yet-full region into a random adjacent free cell; restart on a dead end.
 */
function randomContiguousPartition(n: number, rng: () => number, maxAttempts = 500): number[][] | null {
  const total = n * n;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(-1));
    const sizes = new Array<number>(n).fill(0);
    const seeds = shuffled(rangeIndices(total), rng).slice(0, n);
    seeds.forEach((idx, region) => {
      grid[(idx / n) | 0][idx % n] = region;
      sizes[region] = 1;
    });

    let assigned = n;
    let stuck = false;
    while (assigned < total) {
      const frontier: { region: number; row: number; col: number }[] = [];
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          const region = grid[row][col];
          if (region === -1 || sizes[region] >= n) continue;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr < 0 || nr >= n || nc < 0 || nc >= n || grid[nr][nc] !== -1) continue;
            frontier.push({ region, row: nr, col: nc });
          }
        }
      }
      if (frontier.length === 0) { stuck = true; break; }
      const minSize = Math.min(...frontier.map((f) => sizes[f.region]));
      const pool = frontier.filter((f) => sizes[f.region] === minSize);
      const pick = pool[Math.floor(rng() * pool.length)];
      grid[pick.row][pick.col] = pick.region;
      sizes[pick.region]++;
      assigned++;
    }
    if (!stuck && sizes.every((s) => s === n)) return grid;
  }
  return null;
}

const DEFAULT_REGION_NAMES = [
  'Área 1', 'Área 2', 'Área 3', 'Área 4', 'Área 5', 'Área 6',
  'Área 7', 'Área 8', 'Área 9', 'Área 10', 'Área 11', 'Área 12',
];

function roomsFromRegionGrid(grid: number[][], n: number, names?: string[]): Room[] {
  const rooms: Room[] = Array.from({ length: n }, (_, idx) => ({
    room_id: `region_${idx + 1}`,
    room_name: (names && names[idx]) ?? DEFAULT_REGION_NAMES[idx] ?? `Área ${idx + 1}`,
    room_color: ROOM_PALETTE[idx % ROOM_PALETTE.length],
    cells: [] as BoardCell[],
  }));
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      rooms[grid[row][col]].cells.push({ row, col });
    }
  }
  return rooms;
}

// ─── Latin square solving / counting ─────────────────────────────────────────

const EMPTY = -1;

type Grid = number[][]; // value indices 0..n-1, or EMPTY

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

function fullMask(n: number): number {
  return (1 << n) - 1;
}

/**
 * Counts solutions of a partially filled Latin/region grid, stopping once
 * `limit` solutions have been found. `regions` may be null for plain Latin.
 */
export function countLatinSolutions(
  grid: Grid,
  n: number,
  regions: number[][] | null,
  limit = 2,
): number {
  const rowMask = new Array<number>(n).fill(0);
  const colMask = new Array<number>(n).fill(0);
  const regionCount = regions ? n : 0;
  const regMask = new Array<number>(regionCount).fill(0);
  const work = cloneGrid(grid);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = work[r][c];
      if (v === EMPTY) continue;
      const bit = 1 << v;
      if (rowMask[r] & bit || colMask[c] & bit) return 0;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      if (regions) {
        const reg = regions[r][c];
        if (regMask[reg] & bit) return 0;
        regMask[reg] |= bit;
      }
    }
  }

  const all = fullMask(n);
  let found = 0;

  const candidatesAt = (r: number, c: number): number => {
    let used = rowMask[r] | colMask[c];
    if (regions) used |= regMask[regions[r][c]];
    return all & ~used;
  };

  const search = (): void => {
    if (found >= limit) return;

    // Pick the empty cell with the fewest candidates (MRV).
    let bestR = -1;
    let bestC = -1;
    let bestCand = 0;
    let bestPop = n + 1;
    for (let r = 0; r < n && bestPop > 1; r++) {
      for (let c = 0; c < n; c++) {
        if (work[r][c] !== EMPTY) continue;
        const cand = candidatesAt(r, c);
        const pop = popcount(cand);
        if (pop === 0) return; // dead end
        if (pop < bestPop) {
          bestPop = pop;
          bestCand = cand;
          bestR = r;
          bestC = c;
          if (pop === 1) break;
        }
      }
    }

    if (bestR === -1) {
      found++; // grid is full
      return;
    }

    let cand = bestCand;
    while (cand !== 0 && found < limit) {
      const bit = cand & -cand;
      cand ^= bit;
      const v = Math.log2(bit) | 0;
      work[bestR][bestC] = v;
      rowMask[bestR] |= bit;
      colMask[bestC] |= bit;
      const reg = regions ? regions[bestR][bestC] : -1;
      if (regions) regMask[reg] |= bit;

      search();

      work[bestR][bestC] = EMPTY;
      rowMask[bestR] &= ~bit;
      colMask[bestC] &= ~bit;
      if (regions) regMask[reg] &= ~bit;
    }
  };

  search();
  return found;
}

function popcount(x: number): number {
  let n = x;
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  n = (n + (n >> 4)) & 0x0f0f0f0f;
  return (n * 0x01010101) >> 24;
}

/** Generates one random complete Latin/region grid via randomized backtracking. */
function generateLatinSolution(
  n: number,
  regions: number[][] | null,
  rng: () => number,
): Grid {
  const grid: Grid = Array.from({ length: n }, () => new Array<number>(n).fill(EMPTY));
  const rowMask = new Array<number>(n).fill(0);
  const colMask = new Array<number>(n).fill(0);
  const regMask = new Array<number>(regions ? n : 0).fill(0);
  const all = fullMask(n);

  const fill = (idx: number): boolean => {
    if (idx === n * n) return true;
    const r = (idx / n) | 0;
    const c = idx % n;
    const reg = regions ? regions[r][c] : -1;
    let cand = all & ~(rowMask[r] | colMask[c] | (regions ? regMask[reg] : 0));
    const order = shuffled(maskToValues(cand), rng);
    for (const v of order) {
      const bit = 1 << v;
      grid[r][c] = v;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      if (regions) regMask[reg] |= bit;
      if (fill(idx + 1)) return true;
      grid[r][c] = EMPTY;
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      if (regions) regMask[reg] &= ~bit;
    }
    return false;
  };

  if (!fill(0)) throw new Error(`failed to build a ${n}x${n} latin solution`);
  return grid;
}

function maskToValues(mask: number): number[] {
  const out: number[] = [];
  let m = mask;
  while (m !== 0) {
    const bit = m & -m;
    m ^= bit;
    out.push(Math.log2(bit) | 0);
  }
  return out;
}

// ─── Murdoku layout counting ─────────────────────────────────────────────────

/**
 * Counts how many murdoku layouts are consistent with a set of fixed cells and
 * a set of blocked cells, stopping at `limit`. A layout assigns each duck a
 * cell so that all rows are distinct, all columns are distinct, and no duck
 * lands on a blocked cell. With no clues this is large; clue systems live
 * outside this module, but a clue checker can call this to see whether the
 * remaining ambiguity is 1.
 */
export function countMurdokuLayouts(
  size: number,
  duckIds: readonly string[],
  fixed: ReadonlyArray<{ row: number; col: number; duck_id: string }>,
  blocked: readonly BoardCell[] = [],
  limit = 2,
): number {
  const ducks = duckIds.slice(0, size);
  const duckIndex = new Map(ducks.map((d, i) => [d, i]));
  const blockedKeys = new Set(blocked.map((c) => `${c.row},${c.col}`));

  const rowOfDuck = new Array<number>(size).fill(-1);
  const colOfDuck = new Array<number>(size).fill(-1);
  for (const f of fixed) {
    const di = duckIndex.get(f.duck_id);
    if (di === undefined) throw new Error(`fixed cell uses unknown duck ${f.duck_id}`);
    if (blockedKeys.has(`${f.row},${f.col}`)) return 0;
    rowOfDuck[di] = f.row;
    colOfDuck[di] = f.col;
  }
  // Conflicting fixed cells?
  if (new Set(rowOfDuck.filter((r) => r !== -1)).size !== rowOfDuck.filter((r) => r !== -1).length) return 0;
  if (new Set(colOfDuck.filter((c) => c !== -1)).size !== colOfDuck.filter((c) => c !== -1).length) return 0;

  const usedRows = new Set(rowOfDuck.filter((r) => r !== -1));
  const usedCols = new Set(colOfDuck.filter((c) => c !== -1));
  let found = 0;

  const place = (di: number): void => {
    if (found >= limit) return;
    if (di === size) {
      found++;
      return;
    }
    if (rowOfDuck[di] !== -1) {
      // Already pinned by a fixed cell.
      place(di + 1);
      return;
    }
    for (let r = 0; r < size; r++) {
      if (usedRows.has(r)) continue;
      for (let c = 0; c < size; c++) {
        if (usedCols.has(c)) continue;
        if (blockedKeys.has(`${r},${c}`)) continue;
        rowOfDuck[di] = r;
        colOfDuck[di] = c;
        usedRows.add(r);
        usedCols.add(c);
        place(di + 1);
        usedRows.delete(r);
        usedCols.delete(c);
        rowOfDuck[di] = -1;
        colOfDuck[di] = -1;
        if (found >= limit) return;
      }
    }
  };

  place(0);
  return found;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generatePuzzle(seed: string, opts: GeneratePuzzleOptions = {}): GeneratedPuzzle {
  const size = opts.size ?? 6;
  if (!Number.isInteger(size) || size < 3 || size > 12) {
    throw new Error(`size must be an integer in [3, 12], got ${size}`);
  }
  const playMode: BoardPlayMode = opts.playMode ?? 'murdoku';
  const difficulty: PuzzleDifficulty = opts.difficulty ?? 'medium';
  const duckIds = resolveDuckIds(size, opts.duckIds);
  const maxAttempts = opts.maxAttempts ?? 200;
  const rng = makeRng(`${seed}|${playMode}|${size}|${difficulty}`);

  return playMode === 'latin'
    ? generateLatinPuzzle(seed, size, difficulty, duckIds, rng, opts)
    : generateMurdokuPuzzle(seed, size, difficulty, duckIds, rng, opts, maxAttempts);
}

function generateLatinPuzzle(
  seed: string,
  size: number,
  difficulty: PuzzleDifficulty,
  duckIds: string[],
  rng: () => number,
  opts: GeneratePuzzleOptions,
): GeneratedPuzzle {
  const wantsBox = opts.regionStyle === 'box' || opts.boxRows != null || opts.boxCols != null;

  let regions: number[][] | null = null;
  let rooms: Room[] = [];
  let solutionGrid: Grid | null = null;

  if (wantsBox) {
    let boxRows = opts.boxRows;
    let boxCols = opts.boxCols;
    if (boxRows == null || boxCols == null) {
      const auto = boxDimsForSize(size);
      if (auto) {
        boxRows = auto.boxRows;
        boxCols = auto.boxCols;
      }
    }
    if (boxRows != null && boxCols != null) {
      if (boxRows * boxCols !== size) throw new Error(`boxRows*boxCols must equal size (${size})`);
      regions = regionIndexGrid(size, boxRows, boxCols);
      rooms = buildRooms(size, boxRows, boxCols);
    }
    solutionGrid = generateLatinSolution(size, regions, rng);
  } else {
    // Jigsaw regions: try a few contiguous partitions until one admits a valid
    // region-Latin-square. Fall back to plain Latin (no regions) if all fail.
    for (let attempt = 0; attempt < 60 && solutionGrid == null; attempt++) {
      const partition = randomContiguousPartition(size, rng);
      if (!partition) continue;
      try {
        solutionGrid = generateLatinSolution(size, partition, rng);
        regions = partition;
        rooms = roomsFromRegionGrid(partition, size, opts.roomNames);
      } catch {
        solutionGrid = null;
      }
    }
    if (solutionGrid == null) {
      regions = null;
      rooms = [];
      solutionGrid = generateLatinSolution(size, null, rng);
    }
  }

  // Carve cells while the puzzle stays uniquely solvable.
  const puzzle = cloneGrid(solutionGrid);
  const totalCells = size * size;
  const target = targetGivenCount(totalCells, difficulty, size);
  let givenCount = totalCells;
  for (const [row, col] of allCells(size, rng)) {
    if (givenCount <= target) break;
    const saved = puzzle[row][col];
    puzzle[row][col] = EMPTY;
    if (countLatinSolutions(puzzle, size, regions, 2) === 1) {
      givenCount--;
    } else {
      puzzle[row][col] = saved;
    }
  }

  const solution: SolutionCell[] = [];
  const given: InitialValue[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const duck_id = duckIds[solutionGrid[row][col]];
      solution.push({ row, col, duck_id });
      if (puzzle[row][col] !== EMPTY) given.push({ row, col, duck_id, is_fixed: true });
    }
  }

  return { seed, size, playMode: 'latin', difficulty, duckIds, solution, given, locked: [], rooms };
}

function generateMurdokuPuzzle(
  seed: string,
  size: number,
  difficulty: PuzzleDifficulty,
  duckIds: string[],
  rng: () => number,
  opts: GeneratePuzzleOptions,
  maxAttempts: number,
): GeneratedPuzzle {
  const locked = (opts.lockedCells ?? []).map((c) => ({ row: c.row, col: c.col }));
  const lockedKeys = new Set(locked.map((c) => `${c.row},${c.col}`));
  if (locked.some((c) => c.row < 0 || c.row >= size || c.col < 0 || c.col >= size)) {
    throw new Error('lockedCells must be inside the grid');
  }

  let solutionCells: SolutionCell[] | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cols = shuffled(rangeIndices(size), rng);
    const ducks = shuffled(duckIds, rng);
    const candidate: SolutionCell[] = cols.map((col, row) => ({ row, col, duck_id: ducks[row] }));
    if (candidate.some((cell) => lockedKeys.has(`${cell.row},${cell.col}`))) continue;
    solutionCells = candidate;
    break;
  }
  if (!solutionCells) {
    throw new Error('could not place a murdoku solution that avoids all locked cells');
  }

  // Reveal a difficulty-scaled handful of suspects as fixed seeds.
  // (Full uniqueness for murdoku depends on the clue system, not the grid.)
  const givenRatioBySize = Math.max(1, Math.round(size * (difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 0.34 : 0.18)));
  const order = shuffled(solutionCells, rng);
  const given: InitialValue[] = order
    .slice(0, Math.min(givenRatioBySize, size))
    .map((cell) => ({ row: cell.row, col: cell.col, duck_id: cell.duck_id, is_fixed: true }));

  return {
    seed,
    size,
    playMode: 'murdoku',
    difficulty,
    duckIds,
    solution: solutionCells.slice().sort((a, b) => a.row - b.row || a.col - b.col),
    given,
    locked,
    rooms: [],
  };
}

function* allCells(size: number, rng: () => number): Generator<[number, number]> {
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push([r, c]);
  for (const cell of shuffled(cells, rng)) yield cell;
}
