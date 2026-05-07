import type { BoardData, GameCase } from '../constants/cases';
import { ALL_CASES } from '../constants/cases';
import type { BoardState } from './boardValidator';

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

export function getDailyCaseForDate(date = new Date(), cases = ALL_CASES): DailyCaseInfo {
  const dateKey = getUtcDateKey(date);
  const availableCases = cases.filter((gameCase) => !gameCase.is_premium);
  const playableCases = availableCases.length > 0 ? availableCases : cases;
  const boardSeed = generateDailySeed(dateKey);
  const gameCase = playableCases[boardSeed % playableCases.length];

  return {
    date: dateKey,
    dayNumber: getDailyDayNumber(dateKey),
    boardSeed,
    case: gameCase,
  };
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
