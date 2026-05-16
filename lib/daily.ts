import type { BoardData, BoardPlayMode, GameCase } from '../constants/cases';
import type { BoardState } from './boardValidator';
import type { PuzzleDifficulty } from './puzzleGenerator';
import { buildFastLatinBoard } from './fastLatinBoard';

export interface DailyMove {
  row: number;
  col: number;
  duck_id: string;
  isCorrect: boolean;
}

export interface DailyCaseInfo {
  date: string;
  dayNumber: number;
  boardSeed: number;
  case: GameCase;
}

export interface DailyShareTextInput {
  stars: number;
  timeSeconds: number;
  errors: number;
  shareGrid: string[][];
  dayNumber: number;
  caseName: string;
}

const DAILY_LAUNCH_DATE = '2026-03-22';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function generateDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getDailyDayNumber(dateStr: string): number {
  const current = parseUtcDate(dateStr).getTime();
  const launch = parseUtcDate(DAILY_LAUNCH_DATE).getTime();
  return Math.max(1, Math.floor((current - launch) / MS_PER_DAY) + 1);
}

// ─── Daily case generation ───────────────────────────────────────────────────
//
// The daily case is a procedurally generated Latin-square puzzle ("sudoku of
// ducks"): every suspect appears exactly once per row, per column and per
// region. It carries no narrative / suspect clues — those belong to authored
// murdoku cases. Difficulty ramps over each 7-day cycle.

const DAILY_DUCK_POOL = [
  'duck_tophat', 'duck_plum', 'duck_chef', 'duck_detective', 'duck_butler', 'duck_cowboy',
  'duck_witch', 'duck_pirate', 'duck_king', 'duck_ninja', 'duck_robot', 'duck_witch2',
];

const DAILY_FLAVORS = [
  { title: 'Sudoku de la Mansión', location: 'Quackwell Manor' },
  { title: 'El Enigma del Salón', location: 'Salón Dorado' },
  { title: 'Cuadrícula del Jardín', location: 'Jardín Quackwell' },
  { title: 'Misterio de la Biblioteca', location: 'Biblioteca Vieja' },
  { title: 'El Patrón del Comedor', location: 'Comedor Real' },
  { title: 'Lógica del Recibidor', location: 'Recibidor Quackwell' },
  { title: 'El Reto del Estudio', location: 'Estudio del Conde' },
];

const DIFFICULTY_TIME_TARGET: Record<PuzzleDifficulty, number> = { easy: 420, medium: 600, hard: 780 };
const DIFFICULTY_RATING: Record<PuzzleDifficulty, number> = { easy: 2, medium: 3, hard: 4 };
const DAILY_ROOM_NAMES = ['Salón', 'Cocina', 'Estudio', 'Jardín', 'Recibidor', 'Galería'];

function dailyDuckIds(dayNumber: number): string[] {
  const offset = (dayNumber - 1) % DAILY_DUCK_POOL.length;
  return Array.from({ length: 6 }, (_, i) => DAILY_DUCK_POOL[(offset + i) % DAILY_DUCK_POOL.length]);
}

export function getDailyDifficulty(dayNumber: number): PuzzleDifficulty {
  const dayInCycle = (dayNumber - 1) % 7;
  if (dayInCycle < 2) return 'easy';
  if (dayInCycle < 5) return 'medium';
  return 'hard';
}

// The generated case is deterministic per date, and `getDailyCase` is called
// on every render of several screens, so memoize the last one by date key.
let cachedDailyCase: { key: string; value: GameCase } | null = null;

/** Builds the deterministic generated GameCase for a date. */
export function getDailyCase(date = new Date()): GameCase {
  const dateKey = getUtcDateKey(date);
  if (cachedDailyCase && cachedDailyCase.key === dateKey) return cachedDailyCase.value;
  const dayNumber = getDailyDayNumber(dateKey);
  const difficulty = getDailyDifficulty(dayNumber);
  const duckIds = dailyDuckIds(dayNumber);
  const board = buildFastLatinBoard({
    boardId: `daily_${dateKey}`,
    seed: `daily-${dateKey}`,
    duckIds,
    difficulty,
    roomNames: DAILY_ROOM_NAMES,
  });
  const flavor = DAILY_FLAVORS[(dayNumber - 1) % DAILY_FLAVORS.length];

  const value: GameCase = {
    case_id: `daily_${dateKey}`,
    title: flavor.title,
    subtitle: `Caso del Día #${dayNumber} · cada pato una vez por fila, columna y sala`,
    difficulty: DIFFICULTY_RATING[difficulty],
    location: flavor.location,
    story_intro:
      'Reconstruye la cuadrícula: cada sospechoso aparece exactamente una vez en cada fila, cada columna y cada sala.',
    story_resolution: 'Cuadrícula completada. ¡Buen trabajo, detective!',
    suspects: duckIds.slice(),
    culprit: duckIds[0],
    victim: duckIds[duckIds.length - 1],
    board,
    rewards: { coins: 150, xp: 75, clues: 1, unlock_character: null },
    narrative_clues: [],
    logic_clues: [],
    suspect_clues: [],
    time_target: DIFFICULTY_TIME_TARGET[difficulty],
    is_premium: false,
    prerequisite_cases: [],
    tags: ['diario', 'sudoku', difficulty],
  };
  cachedDailyCase = { key: dateKey, value };
  return value;
}

export function getDailyCaseForDate(date = new Date()): DailyCaseInfo {
  const dateKey = getUtcDateKey(date);
  return {
    date: dateKey,
    dayNumber: getDailyDayNumber(dateKey),
    boardSeed: generateDailySeed(dateKey),
    case: getDailyCase(date),
  };
}

/**
 * Builds just the board for a date (used when only the puzzle is needed).
 * Same date + same play mode -> same board.
 */
export function generateDailyBoard(date = new Date(), playMode: BoardPlayMode = 'latin'): BoardData {
  const dateKey = getUtcDateKey(date);
  const difficulty = getDailyDifficulty(getDailyDayNumber(dateKey));
  if (playMode !== 'latin') {
    return buildFastLatinBoard({
      boardId: `daily_${dateKey}`,
      seed: `daily-${dateKey}`,
      duckIds: dailyDuckIds(getDailyDayNumber(dateKey)),
      difficulty,
      roomNames: DAILY_ROOM_NAMES,
    });
  }
  return buildFastLatinBoard({
    boardId: `daily_${dateKey}`,
    seed: `daily-${dateKey}`,
    duckIds: dailyDuckIds(getDailyDayNumber(dateKey)),
    difficulty,
    roomNames: DAILY_ROOM_NAMES,
  });
}

export function getSecondsToNextUtcMidnight(date = new Date()): number {
  const midnight = new Date(date);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - date.getTime()) / 1000));
}

export function formatDailyTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

export function buildDailyShareGrid(
  board: BoardData,
  boardState: BoardState,
  moveHistory: DailyMove[]
): string[][] {
  const solutionByCell = new Map(board.solution.map((cell) => [`${cell.row},${cell.col}`, cell.duck_id]));
  const movesByCell = new Map<string, DailyMove[]>();
  const movesByDuck = new Map<string, DailyMove[]>();

  for (const move of moveHistory) {
    const cellKey = `${move.row},${move.col}`;
    movesByCell.set(cellKey, [...(movesByCell.get(cellKey) ?? []), move]);
    movesByDuck.set(move.duck_id, [...(movesByDuck.get(move.duck_id) ?? []), move]);
  }

  return board.rooms.map((room) =>
    room.cells.map((cell) => {
      const cellKey = `${cell.row},${cell.col}`;
      const solutionDuck = solutionByCell.get(cellKey);
      const finalDuck = boardState[cell.row]?.[cell.col]?.duck_id ?? null;
      const cellMoves = movesByCell.get(cellKey) ?? [];

      if (solutionDuck && finalDuck === solutionDuck) {
        const duckMoves = movesByDuck.get(solutionDuck) ?? [];
        const firstDuckMove = duckMoves[0];
        const firstCellMove = cellMoves[0];
        const hadWrongCellAttempt = cellMoves.some((move) => move.duck_id !== solutionDuck);
        const wasMovedBefore =
          !!firstDuckMove && (firstDuckMove.row !== cell.row || firstDuckMove.col !== cell.col);
        const solvedFirstTry =
          !!firstCellMove &&
          firstCellMove.duck_id === solutionDuck &&
          !hadWrongCellAttempt &&
          !wasMovedBefore;

        return solvedFirstTry ? '🟩' : '🟨';
      }

      return cellMoves.length > 0 || finalDuck ? '⬜' : '⬜';
    })
  );
}

export function buildDailyShareText({
  stars,
  timeSeconds,
  errors,
  shareGrid,
  dayNumber,
  caseName,
}: DailyShareTextInput): string {
  const safeStars = Math.max(0, Math.min(3, stars));
  const safeErrors = Math.max(0, Math.min(3, errors));
  const starsStr = '⭐'.repeat(safeStars) + '☆'.repeat(3 - safeStars);
  const heartsStr = '❤️'.repeat(3 - safeErrors) + '🖤'.repeat(safeErrors);
  const gridStr = shareGrid.map((row) => row.join('')).join('\n');

  return `🦆 QuackDoku — Caso del Día #${dayNumber}
"${caseName}"
${starsStr} | ⏱ ${formatDailyTime(timeSeconds)} | ${heartsStr}

${gridStr}

¿Podés resolverlo? quackdoku.app`;
}
