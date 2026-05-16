import { create } from 'zustand';
import { BoardData } from '../constants/cases';
import type { DailyMove } from '../lib/daily';
import {
  BoardState,
  buildInitialBoardState,
  findFirstEmptyEditableCell,
  getCellRoom,
  getConflictCellKeys,
  getRoomCellKeys,
  validatePlacement,
  validateBoardDefinition,
  checkSolution,
  isBoardComplete,
  isBoardReadyToSubmit,
  getBoardPlayMode,
  getSolutionMismatchCellKeys,
  findFirstUnsolvedSolutionCell,
  isCellBlocked,
} from '../lib/boardValidator';

export type GamePhase = 'idle' | 'playing' | 'paused' | 'completed' | 'gameover';

interface GameStore {
  // Current game state
  caseId: string | null;
  board: BoardData | null;
  boardState: BoardState;
  phase: GamePhase;

  // HUD state
  hearts: number;
  maxHearts: number;
  clues: number;
  elapsedSeconds: number;
  timeTargetSeconds: number;
  errors: number;

  // Interaction state
  selectedCell: { row: number; col: number } | null;
  notesMode: boolean;
  xMode: boolean;
  history: BoardState[];
  historyMoveLengths: number[];
  moveHistory: DailyMove[];

  // Results
  stars: number;
  earnedCoins: number;
  earnedXp: number;

  // Actions
  startGame: (caseId: string, board: BoardData, timeTargetSeconds: number) => void;
  selectCell: (row: number, col: number) => void;
  placeDuck: (duck_id: string) => PlaceDuckResult;
  placeDuckAt: (row: number, col: number, duck_id: string) => PlaceDuckResult;
  toggleNoteAt: (row: number, col: number, duck_id: string) => boolean;
  submitSolution: () => SubmitSolutionResult;
  toggleXMode: () => void;
  toggleXMarkAt: (row: number, col: number) => boolean;
  clearCellAt: (row: number, col: number) => boolean;
  undoLast: () => void;
  addClues: (amount: number) => void;
  useBasicClue: () => BasicClueResult | null;
  revealCellWithClue: () => RevealClueResult | null;
  toggleNotes: () => void;
  addNote: (duck_id: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  tick: () => void;
  continueAfterGameOver: (costCoins: number) => boolean;
  resetGame: () => void;
}

export interface PlaceDuckResult {
  success: boolean;
  isCorrect: boolean;
  isComplete: boolean;
  lostHeart: boolean;
  conflicts: string[];
  conflictCellKeys: string[];
  row: number | null;
  col: number | null;
  duck_id: string | null;
}

export interface SubmitSolutionResult {
  success: boolean;
  isComplete: boolean;
  lostHeart: boolean;
  conflictCellKeys: string[];
  message: string;
}

export interface BasicClueResult {
  row: number;
  col: number;
  cellKeys: string[];
  message: string;
}

export interface RevealClueResult {
  row: number;
  col: number;
  duck_id: string;
}

const EMPTY_PLACE_RESULT: PlaceDuckResult = {
  success: false,
  isCorrect: false,
  isComplete: false,
  lostHeart: false,
  conflicts: [],
  conflictCellKeys: [],
  row: null,
  col: null,
  duck_id: null,
};

const INITIAL_HEARTS = 3;
const INITIAL_CLUES = 3;

function cloneBoardState(state: BoardState): BoardState {
  return state.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })));
}

function calculateStars(errors: number, elapsedSeconds: number, timeTargetSeconds: number): number {
  const timeTarget = timeTargetSeconds || 600;
  if (errors === 0 && elapsedSeconds <= timeTarget) return 3;
  if (errors <= 2 || elapsedSeconds <= timeTarget * 1.5) return 2;
  return 1;
}

export const useGameStore = create<GameStore>((set, get) => ({
  caseId: null,
  board: null,
  boardState: [],
  phase: 'idle',
  hearts: INITIAL_HEARTS,
  maxHearts: INITIAL_HEARTS,
  clues: INITIAL_CLUES,
  elapsedSeconds: 0,
  timeTargetSeconds: 0,
  errors: 0,
  selectedCell: null,
  notesMode: false,
  xMode: false,
  history: [],
  historyMoveLengths: [],
  moveHistory: [],
  stars: 0,
  earnedCoins: 0,
  earnedXp: 0,

  startGame: (caseId, board, timeTargetSeconds) => {
    const boardValidation = validateBoardDefinition(board);
    if (!boardValidation.isValid) {
      console.warn(
        `Board ${board.board_id} has ${boardValidation.issues.length} definition issue(s):`,
        boardValidation.issues
      );
    }

    set({
      caseId,
      board,
      boardState: buildInitialBoardState(board),
      phase: 'playing',
      hearts: INITIAL_HEARTS,
      maxHearts: INITIAL_HEARTS,
      clues: INITIAL_CLUES,
      elapsedSeconds: 0,
      timeTargetSeconds,
      errors: 0,
      selectedCell: null,
      notesMode: false,
      xMode: false,
      history: [],
      historyMoveLengths: [],
      moveHistory: [],
      stars: 0,
      earnedCoins: 0,
      earnedXp: 0,
    });
  },

  selectCell: (row, col) => {
    const { board, boardState, phase } = get();
    if (phase !== 'playing') return;
    const cell = boardState[row]?.[col];
    if (!board || !cell || cell.is_fixed || isCellBlocked(board, row, col)) return;
    set({ selectedCell: { row, col } });
  },

  placeDuck: (duck_id) => {
    const { selectedCell } = get();
    if (!selectedCell) return EMPTY_PLACE_RESULT;
    return get().placeDuckAt(selectedCell.row, selectedCell.col, duck_id);
  },

  placeDuckAt: (row, col, duck_id) => {
    const {
      board,
      boardState,
      hearts,
      phase,
      notesMode,
      xMode,
      history,
      historyMoveLengths,
      moveHistory,
      errors,
    } = get();

    if (!board || phase !== 'playing') {
      return EMPTY_PLACE_RESULT;
    }

    const playMode = getBoardPlayMode(board);
    const cell = boardState[row]?.[col];

    if (xMode) {
      const marked = get().toggleXMarkAt(row, col);
      return {
        ...EMPTY_PLACE_RESULT,
        success: marked,
        row,
        col,
        duck_id,
      };
    }

    if (!cell || cell.is_fixed || isCellBlocked(board, row, col)) {
      return {
        ...EMPTY_PLACE_RESULT,
        conflicts: ['blocked'],
        conflictCellKeys: [`${row},${col}`],
        row,
        col,
        duck_id,
      };
    }

    // Notes mode: toggle note
    if (notesMode) {
      if (cell.duck_id || cell.x_mark) {
        return EMPTY_PLACE_RESULT;
      }

      const newNotes = cell.notes.includes(duck_id)
        ? cell.notes.filter((n) => n !== duck_id)
        : [...cell.notes, duck_id];
      const newState = boardState.map((r, ri) =>
        r.map((c, ci) => (ri === row && ci === col ? { ...c, notes: newNotes } : c))
      );
      set({ boardState: newState });
      return {
        success: true,
        isCorrect: false,
        isComplete: false,
        lostHeart: false,
        conflicts: [],
        conflictCellKeys: [],
        row,
        col,
        duck_id,
      };
    }

    // Normal placement
    const previousState = cloneBoardState(boardState);
    const validationState: BoardState = playMode === 'murdoku'
      ? boardState.map((r, ri) =>
          r.map((c, ci) =>
            c.duck_id === duck_id || (ri === row && ci === col)
              ? { ...c, duck_id: null, is_correct: null, notes: [] }
              : c
          )
        )
      : boardState;
    const validation = validatePlacement(board, validationState, row, col, duck_id);

    if (!validation.isValid) {
      const conflictCellKeys = getConflictCellKeys(board, validationState, row, col, duck_id, validation.conflicts);
      return {
        success: false,
        isCorrect: false,
        isComplete: false,
        lostHeart: false,
        conflicts: validation.conflicts,
        conflictCellKeys,
        row,
        col,
        duck_id,
      };
    }

    if (playMode === 'murdoku') {
      const newState: BoardState = validationState.map((r, ri) =>
        r.map((c, ci) =>
          ri === row && ci === col
            ? { ...c, duck_id, is_correct: null, x_mark: false, notes: [] }
            : c
        )
      );

      set({
        boardState: newState,
        history: [...history, previousState],
        historyMoveLengths: [...historyMoveLengths, moveHistory.length],
        moveHistory: [...moveHistory, { row, col, duck_id, isCorrect: checkSolution(board, row, col, duck_id) }],
        selectedCell: null,
      });
      return {
        success: true,
        isCorrect: false,
        isComplete: false,
        lostHeart: false,
        conflicts: [],
        conflictCellKeys: [],
        row,
        col,
        duck_id,
      };
    }

    const isCorrectSolution = checkSolution(board, row, col, duck_id);

    if (!isCorrectSolution) {
      // Wrong duck — lose heart
      const newHearts = hearts - 1;
      const newErrors = errors + 1;
      const newPhase: GamePhase = newHearts <= 0 ? 'gameover' : 'playing';
      const conflictCellKeys = getConflictCellKeys(board, boardState, row, col, duck_id, validation.conflicts);

      set({
        hearts: newHearts,
        errors: newErrors,
        phase: newPhase,
        moveHistory: [...moveHistory, { row, col, duck_id, isCorrect: false }],
      });
      return {
        success: false,
        isCorrect: false,
        isComplete: false,
        lostHeart: true,
        conflicts: validation.conflicts,
        conflictCellKeys,
        row,
        col,
        duck_id,
      };
    }

    // Correct placement
    const newHistory = [...history, previousState];
    const newMoveHistory = [...moveHistory, { row, col, duck_id, isCorrect: true }];

    const newState: BoardState = boardState.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, duck_id, is_correct: true, x_mark: false, notes: [] }
          : c
      )
    );

    const complete = isBoardComplete(board, newState);

    if (complete) {
      const { elapsedSeconds, timeTargetSeconds } = get();
      const stars = calculateStars(errors, elapsedSeconds, timeTargetSeconds);

      set({
        boardState: newState,
        history: newHistory,
        historyMoveLengths: [...historyMoveLengths, moveHistory.length],
        moveHistory: newMoveHistory,
        phase: 'completed',
        stars,
        selectedCell: null,
      });

      return {
        success: true,
        isCorrect: true,
        isComplete: true,
        lostHeart: false,
        conflicts: [],
        conflictCellKeys: [],
        row,
        col,
        duck_id,
      };
    }

    set({
      boardState: newState,
      history: newHistory,
      historyMoveLengths: [...historyMoveLengths, moveHistory.length],
      moveHistory: newMoveHistory,
      selectedCell: null,
    });
    return {
      success: true,
      isCorrect: true,
      isComplete: false,
      lostHeart: false,
      conflicts: [],
      conflictCellKeys: [],
      row,
      col,
      duck_id,
    };
  },

  toggleNoteAt: (row, col, duck_id) => {
    const { board, boardState, phase } = get();
    if (!board || phase !== 'playing') return false;

    const cell = boardState[row]?.[col];
    if (!cell || cell.is_fixed || cell.duck_id || cell.x_mark || isCellBlocked(board, row, col)) return false;

    const newNotes = cell.notes.includes(duck_id)
      ? cell.notes.filter((n) => n !== duck_id)
      : [...cell.notes, duck_id];

    const newState = boardState.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, notes: newNotes } : c))
    );
    set({ boardState: newState, selectedCell: { row, col } });
    return true;
  },

  submitSolution: () => {
    const { board, boardState, hearts, phase, errors, elapsedSeconds, timeTargetSeconds } = get();

    if (!board || phase !== 'playing') {
      return {
        success: false,
        isComplete: false,
        lostHeart: false,
        conflictCellKeys: [],
        message: 'No hay una partida activa.',
      };
    }

    if (!isBoardReadyToSubmit(board, boardState)) {
      return {
        success: false,
        isComplete: false,
        lostHeart: false,
        conflictCellKeys: [],
        message: 'Coloca todos los sospechosos antes de acusar.',
      };
    }

    if (isBoardComplete(board, boardState)) {
      const stars = calculateStars(errors, elapsedSeconds, timeTargetSeconds);
      const solvedState = boardState.map((r) =>
        r.map((c) => (c.duck_id ? { ...c, is_correct: true } : c))
      );

      set({
        boardState: solvedState,
        phase: 'completed',
        stars,
        selectedCell: null,
      });

      return {
        success: true,
        isComplete: true,
        lostHeart: false,
        conflictCellKeys: [],
        message: 'Caso resuelto.',
      };
    }

    const conflictCellKeys = getSolutionMismatchCellKeys(board, boardState);
    const newHearts = hearts - 1;
    const newErrors = errors + 1;
    const newPhase: GamePhase = newHearts <= 0 ? 'gameover' : 'playing';

    set({ hearts: newHearts, errors: newErrors, phase: newPhase });

    return {
      success: false,
      isComplete: false,
      lostHeart: true,
      conflictCellKeys,
      message: 'La reconstrucción no encaja. Revisa las celdas marcadas.',
    };
  },

  toggleXMode: () => set((s) => ({ xMode: !s.xMode, notesMode: false, selectedCell: null })),

  toggleXMarkAt: (row, col) => {
    const { board, boardState, phase, history, historyMoveLengths, moveHistory } = get();
    if (!board || phase !== 'playing') return false;

    const cell = boardState[row]?.[col];
    if (!cell || cell.is_fixed || cell.duck_id || isCellBlocked(board, row, col)) return false;

    const previousState = cloneBoardState(boardState);
    const newState: BoardState = boardState.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, x_mark: !c.x_mark, notes: [] }
          : c
      )
    );

    set({
      boardState: newState,
      history: [...history, previousState],
      historyMoveLengths: [...historyMoveLengths, moveHistory.length],
      selectedCell: { row, col },
    });
    return true;
  },

  clearCellAt: (row, col) => {
    const { board, boardState, phase, history, historyMoveLengths, moveHistory } = get();
    if (!board || phase !== 'playing') return false;

    const cell = boardState[row]?.[col];
    if (!cell || cell.is_fixed || isCellBlocked(board, row, col)) return false;
    if (!cell.duck_id && !cell.x_mark && cell.notes.length === 0) return false;

    const previousState = cloneBoardState(boardState);
    const newState: BoardState = boardState.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, duck_id: null, is_correct: null, x_mark: false, notes: [] }
          : c
      )
    );

    set({
      boardState: newState,
      history: [...history, previousState],
      historyMoveLengths: [...historyMoveLengths, moveHistory.length],
      selectedCell: { row, col },
    });
    return true;
  },

  undoLast: () => {
    const { history, historyMoveLengths, moveHistory } = get();
    if (history.length === 0) return;

    const last = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const moveHistoryLength = historyMoveLengths[historyMoveLengths.length - 1] ?? moveHistory.length;
    set({
      boardState: cloneBoardState(last),
      history: newHistory,
      historyMoveLengths: historyMoveLengths.slice(0, -1),
      moveHistory: moveHistory.slice(0, moveHistoryLength),
    });
  },

  addClues: (amount) => {
    set((state) => ({ clues: Math.max(0, state.clues + amount) }));
  },

  useBasicClue: () => {
    const { board, boardState, clues, selectedCell } = get();
    if (!board || clues <= 0) return null;

    const target = selectedCell && !boardState[selectedCell.row][selectedCell.col].duck_id
      ? selectedCell
      : findFirstEmptyEditableCell(board, boardState);

    if (!target) return null;

    const room = getCellRoom(board, target.row, target.col);
    const cellKeys = getRoomCellKeys(board, target.row, target.col);
    set({ clues: clues - 1, selectedCell: target });

    return {
      row: target.row,
      col: target.col,
      cellKeys,
      message: room
        ? `Revisa ${room.room_name}: ahí falta ordenar sus sospechosos.`
        : 'Revisa el grupo resaltado.',
    };
  },

  revealCellWithClue: () => {
    const { board, boardState, clues, selectedCell } = get();
    if (!board || clues <= 0) return null;

    if (getBoardPlayMode(board) === 'murdoku') {
      let sol = selectedCell
        ? board.solution.find((s) => s.row === selectedCell.row && s.col === selectedCell.col)
        : null;

      if (sol && boardState[sol.row][sol.col].duck_id === sol.duck_id) {
        sol = null;
      }

      sol = sol ?? findFirstUnsolvedSolutionCell(board, boardState);
      if (!sol) return null;
      const target = sol;

      const newState: BoardState = boardState.map((r, ri) =>
        r.map((c, ci) => {
          if (c.duck_id === target.duck_id || (ri === target.row && ci === target.col)) {
            return { ...c, duck_id: null, is_correct: null, notes: [] };
          }
          return c;
        })
      );
      newState[target.row][target.col] = {
        ...newState[target.row][target.col],
        duck_id: target.duck_id,
        is_correct: true,
        x_mark: false,
        notes: [],
      };

      const complete = isBoardComplete(board, newState);
      if (complete) {
        const { elapsedSeconds, errors, timeTargetSeconds } = get();
        const stars = calculateStars(errors, elapsedSeconds, timeTargetSeconds);

        set({
          boardState: newState,
          clues: clues - 1,
          phase: 'completed',
          stars,
          selectedCell: { row: target.row, col: target.col },
        });

        return { row: target.row, col: target.col, duck_id: target.duck_id };
      }

      set({ boardState: newState, clues: clues - 1, selectedCell: { row: target.row, col: target.col } });
      return { row: target.row, col: target.col, duck_id: target.duck_id };
    }

    // If cell selected, reveal that cell; otherwise find first empty cell
    let targetRow = -1;
    let targetCol = -1;

    if (selectedCell) {
      const cell = boardState[selectedCell.row][selectedCell.col];
      if (!cell.duck_id && !cell.is_fixed) {
        targetRow = selectedCell.row;
        targetCol = selectedCell.col;
      }
    }

    if (targetRow === -1) {
      outer: for (let r = 0; r < board.grid_size.rows; r++) {
        for (let c = 0; c < board.grid_size.cols; c++) {
          if (!boardState[r][c].duck_id && !boardState[r][c].is_fixed) {
            targetRow = r;
            targetCol = c;
            break outer;
          }
        }
      }
    }

    if (targetRow === -1) return null;

    const sol = board.solution.find((s) => s.row === targetRow && s.col === targetCol);
    if (!sol) return null;

    const newState: BoardState = boardState.map((r, ri) =>
      r.map((c, ci) =>
        ri === targetRow && ci === targetCol
          ? { ...c, duck_id: sol.duck_id, is_correct: true, x_mark: false, notes: [] }
          : c
      )
    );

    const complete = isBoardComplete(board, newState);
    if (complete) {
      const { elapsedSeconds, errors, timeTargetSeconds } = get();
      const stars = calculateStars(errors, elapsedSeconds, timeTargetSeconds);

      set({
        boardState: newState,
        clues: clues - 1,
        phase: 'completed',
        stars,
        selectedCell: { row: targetRow, col: targetCol },
      });

      return { row: targetRow, col: targetCol, duck_id: sol.duck_id };
    }

    set({ boardState: newState, clues: clues - 1, selectedCell: { row: targetRow, col: targetCol } });
    return { row: targetRow, col: targetCol, duck_id: sol.duck_id };
  },

  toggleNotes: () => set((s) => ({ notesMode: !s.notesMode, xMode: false })),

  addNote: (duck_id) => {
    const { boardState, selectedCell } = get();
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const cell = boardState[row][col];
    if (cell.is_fixed || cell.duck_id || cell.x_mark) return;

    const newNotes = cell.notes.includes(duck_id)
      ? cell.notes.filter((n) => n !== duck_id)
      : [...cell.notes, duck_id];

    const newState = boardState.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, notes: newNotes } : c))
    );
    set({ boardState: newState });
  },

  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'playing' }),

  tick: () => {
    if (get().phase === 'playing') {
      set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
    }
  },

  continueAfterGameOver: (costCoins) => {
    // User spends coins to continue — handled by userStore
    set({ phase: 'playing', hearts: 3 });
    return true;
  },

  resetGame: () =>
    set({
      caseId: null,
      board: null,
      boardState: [],
      phase: 'idle',
      hearts: INITIAL_HEARTS,
      maxHearts: INITIAL_HEARTS,
      clues: INITIAL_CLUES,
      elapsedSeconds: 0,
      timeTargetSeconds: 0,
      errors: 0,
      selectedCell: null,
      notesMode: false,
      xMode: false,
      history: [],
      historyMoveLengths: [],
      moveHistory: [],
      stars: 0,
    }),
}));
