import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, Fonts, Radius, Shadow } from '../../constants/theme';
import { CASE_MAP } from '../../constants/cases';
import { useGameStore, type PlaceDuckResult } from '../../stores/gameStore';
import { useDailyStore } from '../../stores/dailyStore';
import { useUserStore } from '../../stores/userStore';
import { buildDailyShareGrid, getDailyCaseForDate } from '../../lib/daily';
import MansionBoard from '../../components/board/MansionBoard';
import DuckSelector from '../../components/board/DuckSelector';
import HeartsDisplay from '../../components/ui/HeartsDisplay';
import Button from '../../components/ui/Button';
import DuckAvatar from '../../components/ui/DuckAvatar';
import GameAsset from '../../components/ui/GameAsset';
import { DUCK_MAP } from '../../constants/ducks';
import {
  getBoardPlayMode,
  getCellKey,
  getDuckTargetPlacementCount,
  getUnavailableCellKeysForDuck,
  isBoardReadyToSubmit,
} from '../../lib/boardValidator';
import {
  onContinueDenied,
  onContinueOfferShown,
  onContinuePaidCoins,
  onHintUsed,
  onLevelComplete,
  onLifeLost,
  onNeedHint,
} from '../../lib/monetization';
import type { GameMonetizationContext } from '../../lib/monetization';
import { haptics } from '../../lib/haptics';
import { playSfx } from '../../lib/sound';
import { track } from '../../lib/telemetry';
import TutorialOverlay, { DEFAULT_TUTORIAL_STEPS } from '../../components/tutorial/TutorialOverlay';

export default function GameScreen() {
  const { caseId, daily } = useLocalSearchParams<{ caseId: string; daily?: string }>();
  const isDailyRun = daily === '1';
  const gameCase = useMemo(
    () => (isDailyRun ? getDailyCaseForDate().case : CASE_MAP[caseId ?? '']),
    [isDailyRun, caseId],
  );

  const {
    board,
    boardState,
    phase,
    hearts,
    maxHearts,
    clues,
    elapsedSeconds,
    errors,
    stars,
    selectedCell,
    history,
    moveHistory,
    startGame,
    selectCell,
    placeDuckAt,
    submitSolution,
    undoLast,
    useBasicClue,
    pauseGame,
    resumeGame,
    tick,
    continueAfterGameOver,
    resetGame,
  } = useGameStore();

  const { completeCaseReward, spendCoins, coins } = useUserStore();
  const hasSeenTutorial = useUserStore((state) => state.hasSeenTutorial);
  const markTutorialSeen = useUserStore((state) => state.markTutorialSeen);
  const completeDailyCase = useDailyStore((state) => state.completeDailyCase);

  const [tutorialVisible, setTutorialVisible] = useState(false);

  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [activeDuckId, setActiveDuckId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [caseCluesExpanded, setCaseCluesExpanded] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardedCaseRef = useRef<string | null>(null);
  const gameOverOfferRef = useRef<string | null>(null);

  // Init game
  useEffect(() => {
    if (gameCase) {
      startGame(gameCase.case_id, gameCase.board, gameCase.time_target);
      setErrorCells(new Set());
      setConflictCells(new Set());
      setCorrectCells(new Set());
      setHintCells(new Set());
      setActiveDuckId(null);
      setFeedbackMessage(null);
      setCaseCluesExpanded(getBoardPlayMode(gameCase.board) === 'murdoku' && !gameCase.board.background_image);

      track('case_started', {
        case_id: gameCase.case_id,
        title: gameCase.title,
        difficulty: gameCase.difficulty,
        play_mode: getBoardPlayMode(gameCase.board),
        is_daily: isDailyRun,
      });

      if (!hasSeenTutorial) {
        setTutorialVisible(true);
        track('tutorial_started', { case_id: gameCase.case_id });
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [gameCase?.case_id]);

  useEffect(() => {
    if (phase === 'playing') {
      rewardedCaseRef.current = null;
      gameOverOfferRef.current = null;
    }
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase === 'playing' && !tutorialVisible) {
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, tutorialVisible]);

  // Reward on completion
  useEffect(() => {
    if (phase === 'completed' && gameCase && rewardedCaseRef.current !== gameCase.case_id) {
      rewardedCaseRef.current = gameCase.case_id;
      const isPerfect = errors === 0;
      const rewardCoins = isDailyRun ? 150 : gameCase.rewards.coins;
      const rewardXp = isDailyRun ? 75 : gameCase.rewards.xp;
      completeCaseReward(
        rewardCoins,
        rewardXp,
        gameCase.rewards.clues,
        isPerfect,
        elapsedSeconds
      );

      if (isDailyRun) {
        const dailyCase = getDailyCaseForDate();
        completeDailyCase({
          date: dailyCase.date,
          caseId: gameCase.case_id,
          caseName: gameCase.title,
          dayNumber: dailyCase.dayNumber,
          stars,
          timeSeconds: elapsedSeconds,
          errors,
          shareGrid: buildDailyShareGrid(gameCase.board, boardState, moveHistory),
        });
      }

      onLevelComplete(
        stars,
        rewardCoins,
        rewardXp,
        gameCase.rewards.clues,
        isPerfect,
        {
          caseId: gameCase.case_id,
          isDailyRun,
          playMode: getBoardPlayMode(gameCase.board),
          elapsedSeconds,
          errors,
          cluesLeft: clues,
          heartsLeft: hearts,
        }
      );

      track('case_completed', {
        case_id: gameCase.case_id,
        title: gameCase.title,
        difficulty: gameCase.difficulty,
        play_mode: getBoardPlayMode(gameCase.board),
        is_daily: isDailyRun,
        stars,
        elapsed_seconds: elapsedSeconds,
        errors,
        is_perfect: isPerfect,
        hearts_left: hearts,
        clues_left: clues,
        coins_reward: rewardCoins,
        xp_reward: rewardXp,
      });
      if (isDailyRun) {
        track('daily_completed', {
          case_id: gameCase.case_id,
          stars,
          elapsed_seconds: elapsedSeconds,
          errors,
        });
      }
    }
  }, [
    phase,
    gameCase?.case_id,
    errors,
    elapsedSeconds,
    clues,
    hearts,
    completeCaseReward,
    isDailyRun,
    completeDailyCase,
    stars,
    boardState,
    moveHistory,
  ]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const playMode = board ? getBoardPlayMode(board) : 'latin';
  const duckLabels = useMemo(() => {
    if (gameCase?.case_id !== 'case_006') return undefined;

    return {
      duck_tophat: 'A',
      duck_chef: 'B',
      duck_witch: 'C',
      duck_detective: 'D',
      duck_butler: 'E',
      duck_cowboy: 'F',
      duck_pirate: 'G',
      duck_king: 'H',
      duck_plum: 'V',
    };
  }, [gameCase?.case_id]);
  const getMonetizationContext = useCallback(
    (overrides: Partial<GameMonetizationContext> = {}): GameMonetizationContext | null => {
      if (!gameCase) return null;

      return {
        caseId: gameCase.case_id,
        isDailyRun,
        playMode,
        elapsedSeconds,
        errors,
        cluesLeft: clues,
        heartsLeft: hearts,
        ...overrides,
      };
    },
    [clues, elapsedSeconds, errors, gameCase?.case_id, hearts, isDailyRun, playMode]
  );

  const activeCharacterClue = useMemo(() => {
    if (!gameCase || !activeDuckId) return null;
    return gameCase.suspect_clues.find((clue) => clue.duck_id === activeDuckId)?.clue ?? null;
  }, [activeDuckId, gameCase]);

  useEffect(() => {
    if (phase !== 'gameover' || !gameCase || gameOverOfferRef.current === gameCase.case_id) return;

    const context = getMonetizationContext({ heartsLeft: 0 });
    if (!context) return;

    gameOverOfferRef.current = gameCase.case_id;
    onContinueOfferShown(100, coins, context);
  }, [coins, gameCase, getMonetizationContext, phase]);

  const caseClues = useMemo(() => {
    if (!gameCase) return [];
    return [...gameCase.narrative_clues, ...gameCase.logic_clues];
  }, [gameCase]);
  const duckTargetPlacementCount = useMemo(() => {
    if (!board) return 1;
    return Math.max(...board.duck_ids.map((duckId) => getDuckTargetPlacementCount(board, duckId)));
  }, [board]);
  const canSubmitSolution = useMemo(() => {
    if (!board || boardState.length === 0) return false;
    return isBoardReadyToSubmit(board, boardState);
  }, [board, boardState]);
  const blockedCells = useMemo(() => {
    if (!board || boardState.length === 0) return new Set<string>();
    const playModeForGuide = getBoardPlayMode(board);
    const permanentBlocked = new Set((board.blocked_cells ?? []).map((cell) => getCellKey(cell.row, cell.col)));

    if (playModeForGuide === 'murdoku') {
      if (!activeDuckId) return new Set<string>();

      const guide = new Set<string>();
      const addGuideCell = (row: number, col: number) => {
        const key = getCellKey(row, col);
        const cell = boardState[row]?.[col];
        if (!cell || cell.duck_id || cell.is_fixed || permanentBlocked.has(key)) return;
        guide.add(key);
      };

      for (let row = 0; row < board.grid_size.rows; row++) {
        for (let col = 0; col < board.grid_size.cols; col++) {
          if (!boardState[row]?.[col]?.duck_id) continue;
          for (let c = 0; c < board.grid_size.cols; c++) addGuideCell(row, c);
          for (let r = 0; r < board.grid_size.rows; r++) addGuideCell(r, col);
        }
      }

      return guide;
    }

    if (!activeDuckId) return new Set<string>();
    return new Set(
      getUnavailableCellKeysForDuck(board, boardState, activeDuckId).filter((key) => !permanentBlocked.has(key))
    );
  }, [activeDuckId, board, boardState]);
  const boardMaxSize = useMemo(() => {
    const selectorReserve = (board?.duck_ids.length ?? 0) > 6 ? 150 : 158;
    const characterClueReserve = activeCharacterClue ? 44 : 0;
    const hudReserve = 48;
    const clueReserve = playMode === 'latin'
      ? 34
      : caseClues.length > 0
      ? caseCluesExpanded ? 86 : 36
      : 0;
    const feedbackReserve = feedbackMessage ? 34 : 0;
    const availableByHeight = windowHeight - selectorReserve - characterClueReserve - hudReserve - clueReserve - feedbackReserve - 4;
    return Math.min(windowWidth, Math.max(260, availableByHeight));
  }, [
    board?.duck_ids.length,
    activeCharacterClue,
    caseClues.length,
    caseCluesExpanded,
    feedbackMessage,
    playMode,
    windowHeight,
    windowWidth,
  ]);

  const clearFeedbackLater = (delay = 1800) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackMessage(null);
      feedbackTimerRef.current = null;
    }, delay);
  };

  const showTemporaryCells = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    keys: string[],
    delay = 900
  ) => {
    setter(new Set(keys));
    setTimeout(() => setter(new Set()), delay);
  };

  const describeConflicts = (conflicts: string[]) => {
    if (conflicts.length === 0) return 'Ese pato no encaja en esta celda.';

    const labels: Record<string, string> = {
      row: 'fila',
      col: 'columna',
      room: 'habitación',
      duck: 'sospechoso repetido',
      blocked: 'celda bloqueada',
      xmark: 'casilla descartada',
      solution: 'solución',
    };

    return `Conflicto en ${conflicts.map((conflict) => labels[conflict] ?? conflict).join(', ')}.`;
  };

  const applyPlacementFeedback = useCallback(
    (result: PlaceDuckResult, fallbackKey: string) => {
      if (result.lostHeart) {
        const context = getMonetizationContext({
          errors: errors + 1,
          heartsLeft: Math.max(0, hearts - 1),
        });
        if (context) {
          onLifeLost('placement', context, result.duck_id, result.row, result.col);
        }
        track('life_lost', {
          reason: 'placement',
          case_id: gameCase?.case_id,
          hearts_left: Math.max(0, hearts - 1),
        });

        haptics.error();
        playSfx('error');

        const key = result.row !== null && result.col !== null ? `${result.row},${result.col}` : fallbackKey;
        showTemporaryCells(setErrorCells, [key], 700);
        showTemporaryCells(setConflictCells, result.conflictCellKeys.length ? result.conflictCellKeys : [key], 1000);
        setFeedbackMessage(describeConflicts(result.conflicts));
        clearFeedbackLater();
        return;
      }

      if (!result.success && result.conflicts.length > 0) {
        haptics.warning();
        playSfx('error');

        const key = result.row !== null && result.col !== null ? `${result.row},${result.col}` : fallbackKey;
        showTemporaryCells(setConflictCells, result.conflictCellKeys.length ? result.conflictCellKeys : [key], 1000);
        setFeedbackMessage(describeConflicts(result.conflicts));
        clearFeedbackLater();
        return;
      }

      if (result.isCorrect && result.row !== null && result.col !== null) {
        if (result.isComplete) {
          haptics.success();
          playSfx('victory');
        } else {
          haptics.medium();
          playSfx('place');
        }
        showTemporaryCells(setCorrectCells, [`${result.row},${result.col}`], 800);
        if (!result.isComplete) {
          setFeedbackMessage('Correcto.');
          clearFeedbackLater(1200);
        }
        return;
      }

      if (result.success && playMode === 'murdoku') {
        haptics.light();
        playSfx('place');
        setFeedbackMessage(canSubmitSolution ? 'Listo para acusar.' : 'Sospechoso colocado.');
        clearFeedbackLater(1200);
      }
    },
    [canSubmitSolution, errors, getMonetizationContext, hearts, playMode]
  );

  const placeDuckOnCell = useCallback(
    (row: number, col: number, duckId: string) => {
      const key = `${row},${col}`;
      if (blockedCells.has(key)) {
        showTemporaryCells(setConflictCells, [key], 900);
        setFeedbackMessage(
          playMode === 'murdoku'
            ? 'Esa fila o columna ya tiene un sospechoso.'
            : 'Esa celda está tachada para este pato.'
        );
        clearFeedbackLater();
        return;
      }

      const result = placeDuckAt(row, col, duckId);
      applyPlacementFeedback(result, key);
      if (result.success && playMode === 'murdoku') {
        setActiveDuckId(null);
        setHintCells(new Set());
      }
    },
    [applyPlacementFeedback, blockedCells, placeDuckAt, playMode]
  );

  const handlePlaceDuck = useCallback(
    (duckId: string) => {
      setActiveDuckId(duckId);
      const selectedState = selectedCell ? boardState[selectedCell.row]?.[selectedCell.col] : null;
      if (playMode !== 'murdoku' && selectedCell && selectedState && !selectedState.duck_id && !selectedState.is_fixed) {
        placeDuckOnCell(selectedCell.row, selectedCell.col, duckId);
        return;
      }

      setFeedbackMessage(
        playMode === 'murdoku'
          ? 'Toca una casilla para colocar al sospechoso.'
          : 'Sospechoso seleccionado. Toca una casilla libre del tablero.'
      );
      clearFeedbackLater(2000);
    },
    [boardState, placeDuckOnCell, playMode, selectedCell]
  );

  const handleFocusDuck = useCallback((duckId: string) => {
    haptics.selection();
    playSfx('select');
    setActiveDuckId(duckId);

    const suspectClue = gameCase?.suspect_clues.find((clue) => clue.duck_id === duckId);
    setHintCells(
      new Set((suspectClue?.highlight_cells ?? []).map((cell) => getCellKey(cell.row, cell.col)))
    );
  }, [gameCase]);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (activeDuckId) {
        placeDuckOnCell(row, col, activeDuckId);
        return;
      }

      selectCell(row, col);
    },
    [activeDuckId, placeDuckOnCell, selectCell]
  );

  const handleCellLongPress = useCallback(() => {}, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) {
      haptics.warning();
      return;
    }
    haptics.light();
    playSfx('undo');
    undoLast();
  }, [history.length, undoLast]);

  const handleBasicHint = useCallback(() => {
    const result = useBasicClue();
    if (!result) {
      const context = getMonetizationContext();
      if (context) {
        onNeedHint('basic_hint', clues <= 0 ? 'no_clues' : 'no_target', context);
      }
      track('hint_denied', {
        reason: clues <= 0 ? 'no_clues' : 'no_target',
        case_id: gameCase?.case_id,
      });
      haptics.warning();
      Alert.alert('Sin pistas', 'No hay pistas disponibles o no quedan celdas vacías.');
      return;
    }

    const context = getMonetizationContext({ cluesLeft: Math.max(0, clues - 1) });
    if (context) {
      onHintUsed('basic_hint', 'inventory', Math.max(0, clues - 1), context);
    }
    track('hint_used', {
      type: 'basic_hint',
      source: 'inventory',
      case_id: gameCase?.case_id,
      clues_left: Math.max(0, clues - 1),
    });

    haptics.medium();
    playSfx('hint');
    showTemporaryCells(setHintCells, result.cellKeys, 2400);
    setFeedbackMessage(result.message);
    clearFeedbackLater(2600);
  }, [clues, getMonetizationContext, useBasicClue]);

  const handleSubmitSolution = useCallback(() => {
    const result = submitSolution();

    if (result.lostHeart) {
      const context = getMonetizationContext({
        errors: errors + 1,
        heartsLeft: Math.max(0, hearts - 1),
      });
      if (context) {
        onLifeLost('accusation', context);
      }
      track('life_lost', {
        reason: 'accusation',
        case_id: gameCase?.case_id,
        hearts_left: Math.max(0, hearts - 1),
      });
      haptics.error();
      playSfx('error');
    }
    track('accusation_submitted', {
      case_id: gameCase?.case_id,
      is_complete: result.isComplete,
      lost_heart: result.lostHeart,
    });

    if (result.isComplete) {
      haptics.success();
      playSfx('victory');
      return;
    }

    if (result.conflictCellKeys.length > 0) {
      showTemporaryCells(result.lostHeart ? setErrorCells : setConflictCells, result.conflictCellKeys, 1300);
    }

    setFeedbackMessage(result.message);
    clearFeedbackLater(2200);
  }, [errors, getMonetizationContext, hearts, submitSolution]);

  const handleContinue = () => {
    const success = spendCoins(100);
    const context = getMonetizationContext({ heartsLeft: 0 });
    if (success) {
      if (context) {
        onContinuePaidCoins(100, Math.max(0, coins - 100), context);
      }
      continueAfterGameOver(100);
    } else {
      if (context) {
        onContinueDenied('not_enough_coins', 100, coins, context);
      }
      Alert.alert('Sin monedas', 'No tienes suficientes monedas para continuar.');
    }
  };

  if (!gameCase || !board || boardState.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando caso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const culpritDuck = DUCK_MAP[gameCase.culprit];
  const victimDuck = DUCK_MAP[gameCase.victim];

  return (
    <SafeAreaView style={styles.safe}>
      {/* HUD */}
      <View style={styles.hud}>
        <Pressable onPress={() => pauseGame()} style={styles.pauseBtn}>
          <Text style={styles.pauseIcon}>⏸</Text>
        </Pressable>

        <View style={styles.hudCenter}>
          <Text style={styles.caseTitle} numberOfLines={1}>{gameCase.title}</Text>
          <HeartsDisplay hearts={hearts} maxHearts={maxHearts} />
        </View>

        <View style={styles.hudRight}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <View style={styles.cluesHud}>
            <GameAsset name="clue" size={18} />
            <Text style={styles.cluesHudText}>{clues}</Text>
          </View>
        </View>
      </View>

      {playMode === 'murdoku' && caseClues.length > 0 && (
        <View style={[styles.cluePanel, caseCluesExpanded ? styles.cluePanelExpanded : styles.cluePanelCompact]}>
          <Pressable onPress={() => setCaseCluesExpanded((value) => !value)}>
            <View style={styles.clueHeader}>
              <Text style={styles.clueCounter}>{caseCluesExpanded ? 'Ocultar' : `${caseClues.length} reglas`}</Text>
            </View>
            {!caseCluesExpanded && (
              <Text style={styles.cluePreview} numberOfLines={2}>
                1. {caseClues[0]}
              </Text>
            )}
          </Pressable>
          {caseCluesExpanded ? (
            <ScrollView style={styles.clueScroll} showsVerticalScrollIndicator={false}>
              {caseClues.map((clue, index) => (
                <Text key={`${index}-${clue}`} style={styles.clueText}>
                  {index + 1}. {clue}
                </Text>
              ))}
            </ScrollView>
          ) : null}
        </View>
      )}

      {playMode === 'latin' && (
        <View style={styles.rulesBanner}>
          <Text style={styles.rulesBannerIcon}>🧩</Text>
          <Text style={styles.rulesBannerText}>
            Cada sospechoso aparece <Text style={styles.rulesBannerStrong}>una vez</Text> por fila, columna y área.
          </Text>
        </View>
      )}

      {/* Board */}
      <View style={styles.boardContainer}>
        <MansionBoard
          board={board}
          boardState={boardState}
          selectedCell={selectedCell}
          errorCells={errorCells}
          conflictCells={conflictCells}
          correctCells={correctCells}
          hintCells={hintCells}
          blockedCells={blockedCells}
          onCellPress={handleCellPress}
          onCellLongPress={handleCellLongPress}
          maxBoardSize={boardMaxSize}
        />
      </View>

      {feedbackMessage && (
        <View style={styles.feedbackBar}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Duck selector */}
      <DuckSelector
        duckIds={board.duck_ids}
        boardState={boardState}
        duckTargetCount={duckTargetPlacementCount}
        onSelectDuck={handlePlaceDuck}
        onFocusDuck={handleFocusDuck}
        onUndo={handleUndo}
        onBasicHint={handleBasicHint}
        onSubmitSolution={handleSubmitSolution}
        canUndo={history.length > 0}
        canSubmitSolution={canSubmitSolution}
        cluesLeft={clues}
        activeDuckId={activeDuckId}
        lockCompletedDucks={playMode === 'latin'}
        duckLabels={duckLabels}
        suspectClues={gameCase.suspect_clues}
      />

      {/* PAUSE Modal */}
      <Modal visible={phase === 'paused'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⏸ Pausa</Text>
            <Text style={styles.modalCase}>{gameCase.title}</Text>
            <Text style={styles.modalTime}>{formatTime(elapsedSeconds)}</Text>
            <Button label="Continuar" onPress={resumeGame} fullWidth style={styles.modalBtn} />
            <Button
              label="Abandonar"
              variant="secondary"
              onPress={() => { resetGame(); router.back(); }}
              fullWidth
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      {/* GAME OVER Modal */}
      <Modal visible={phase === 'gameover'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <GameAsset name="heartEmpty" size={64} />
            <Text style={styles.modalTitle}>Se acabaron las vidas</Text>
            <Text style={styles.gameOverSub}>¿Quieres continuar?</Text>
            <Button label="Continuar (🪙 100)" onPress={handleContinue} fullWidth style={styles.modalBtn} />
            <Button
              label="Volver al inicio"
              variant="secondary"
              onPress={() => { resetGame(); router.replace('/(tabs)'); }}
              fullWidth
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      {/* COMPLETED Modal */}
      <Modal visible={phase === 'completed'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, styles.completedCard]}>
            <Text style={styles.completedEmoji}>🎉</Text>
            <Text style={styles.completedTitle}>¡CASO RESUELTO!</Text>
            <Text style={styles.completedCase}>{gameCase.title}</Text>

            <View style={styles.starsRow}>
              {Array.from({ length: 3 }, (_, i) => (
                <Text key={i} style={styles.star}>
                  {i < stars ? '⭐' : '☆'}
                </Text>
              ))}
            </View>

            {playMode === 'murdoku' ? (
              <>
                <Text style={styles.culpritReveal}>
                  La víctima era {victimDuck?.name ?? gameCase.victim}. {'\n'}
                  El culpable era... {'\n'}
                  <Text style={styles.culpritName}>
                    {culpritDuck?.name ?? gameCase.culprit}
                  </Text>
                </Text>
                {culpritDuck && <DuckAvatar duck={culpritDuck} size={96} style={styles.culpritAvatar} />}
              </>
            ) : (
              <Text style={styles.culpritReveal}>Cuadrícula resuelta con lógica impecable.</Text>
            )}

            <View style={styles.rewardsRow}>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>+{isDailyRun ? 150 : gameCase.rewards.coins}</Text>
                <GameAsset name="coin" size={18} />
              </View>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>+{isDailyRun ? 75 : gameCase.rewards.xp} XP</Text>
              </View>
              {errors === 0 && (
                <View style={styles.rewardChip}>
                  <Text style={styles.rewardText}>+30 perfecto</Text>
                  <GameAsset name="coin" size={18} />
                </View>
              )}
            </View>

            <Button
              label={isDailyRun ? 'Ver resultado diario' : 'Volver a casos'}
              onPress={() => { resetGame(); router.replace(isDailyRun ? '/daily/result' : '/(tabs)/cases'); }}
              fullWidth
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      <TutorialOverlay
        visible={tutorialVisible}
        steps={DEFAULT_TUTORIAL_STEPS}
        onComplete={() => {
          markTutorialSeen();
          setTutorialVisible(false);
          track('tutorial_completed', { case_id: gameCase?.case_id });
        }}
        onSkip={() => {
          markTutorialSeen();
          setTutorialVisible(false);
          track('tutorial_skipped', { case_id: gameCase?.case_id });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Fonts.body,
    color: Colors.whiteMuted,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,199,0,0.16)',
  },
  pauseBtn: {
    padding: Spacing.xs,
  },
  pauseIcon: {
    fontSize: 22,
    color: Colors.whiteMuted,
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  caseTitle: {
    fontSize: 12,
    color: Colors.whiteMuted,
    fontWeight: '600',
  },
  hudRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  timer: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.yellow,
  },
  cluesHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cluesHudText: {
    fontSize: Fonts.small,
    color: Colors.whiteMuted,
    fontWeight: '700',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 0,
  },
  cluePanel: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(255,199,0,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.48)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  cluePanelCompact: {
    maxHeight: 54,
  },
  cluePanelExpanded: {
    maxHeight: 94,
  },
  clueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  clueCounter: {
    fontSize: 10,
    color: Colors.whiteMuted,
    fontWeight: '800',
  },
  clueScroll: {
    maxHeight: 62,
  },
  clueText: {
    fontSize: 11,
    color: Colors.whiteMuted,
    lineHeight: 16,
    marginBottom: 3,
  },
  cluePreview: {
    fontSize: 11,
    color: Colors.whiteMuted,
    lineHeight: 15,
  },
  rulesBanner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,199,0,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.42)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  rulesBannerIcon: {
    fontSize: 16,
  },
  rulesBannerText: {
    flex: 1,
    color: Colors.grayLight,
    fontSize: Fonts.xs,
    fontWeight: '600',
    lineHeight: 16,
  },
  rulesBannerStrong: {
    color: Colors.yellow,
    fontWeight: '900',
  },
  feedbackBar: {
    marginHorizontal: Spacing.md,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15,15,35,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.36)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  feedbackText: {
    color: Colors.whiteMuted,
    fontSize: Fonts.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  completedCard: {
    backgroundColor: Colors.blackPremium,
  },
  modalTitle: {
    fontSize: Fonts.h3,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  modalCase: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  modalTime: {
    fontSize: Fonts.h2,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  modalBtn: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  gameOverSub: {
    color: Colors.gray,
    fontSize: Fonts.small,
  },
  completedEmoji: {
    fontSize: 64,
  },
  completedTitle: {
    fontSize: Fonts.h2,
    fontWeight: '900',
    color: Colors.yellow,
    letterSpacing: 1,
  },
  completedCase: {
    fontSize: Fonts.small,
    color: Colors.grayLight,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  star: {
    fontSize: 32,
  },
  culpritReveal: {
    color: Colors.grayLight,
    fontSize: Fonts.small,
    textAlign: 'center',
    lineHeight: 22,
  },
  culpritName: {
    color: Colors.yellow,
    fontWeight: '700',
    fontSize: Fonts.body,
  },
  culpritAvatar: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,204,0,0.2)',
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  rewardText: {
    color: Colors.yellow,
    fontWeight: '700',
    fontSize: Fonts.small,
  },
});
