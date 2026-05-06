import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, Fonts, Radius, Shadow } from '../../constants/theme';
import { CASE_MAP } from '../../constants/cases';
import { useGameStore } from '../../stores/gameStore';
import { useUserStore } from '../../stores/userStore';
import MansionBoard from '../../components/board/MansionBoard';
import DuckSelector from '../../components/board/DuckSelector';
import HeartsDisplay from '../../components/ui/HeartsDisplay';
import Button from '../../components/ui/Button';
import DuckAvatar from '../../components/ui/DuckAvatar';
import GameAsset from '../../components/ui/GameAsset';
import { DUCK_MAP } from '../../constants/ducks';
import {
  getBoardPlayMode,
  getDuckTargetPlacementCount,
  getUnavailableCellKeysForDuck,
  isBoardReadyToSubmit,
} from '../../lib/boardValidator';

export default function GameScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const gameCase = CASE_MAP[caseId ?? ''];

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
    notesMode,
    xMode,
    history,
    startGame,
    selectCell,
    placeDuck,
    placeDuckAt,
    submitSolution,
    toggleXMode,
    toggleXMarkAt,
    undoLast,
    useBasicClue,
    revealCellWithClue,
    toggleNotes,
    pauseGame,
    resumeGame,
    tick,
    continueAfterGameOver,
    resetGame,
  } = useGameStore();

  const { completeCaseReward, spendCoins } = useUserStore();

  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [conflictCells, setConflictCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [activeDuckId, setActiveDuckId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardedCaseRef = useRef<string | null>(null);

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
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [gameCase?.case_id]);

  useEffect(() => {
    if (phase === 'playing') {
      rewardedCaseRef.current = null;
    }
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Reward on completion
  useEffect(() => {
    if (phase === 'completed' && gameCase && rewardedCaseRef.current !== gameCase.case_id) {
      rewardedCaseRef.current = gameCase.case_id;
      const isPerfect = errors === 0;
      completeCaseReward(
        gameCase.rewards.coins,
        gameCase.rewards.xp,
        gameCase.rewards.clues,
        isPerfect,
        elapsedSeconds
      );
    }
  }, [phase, gameCase?.case_id, errors, elapsedSeconds, completeCaseReward]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const playMode = board ? getBoardPlayMode(board) : 'latin';
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
    return new Set(getUnavailableCellKeysForDuck(board, boardState, activeDuckId));
  }, [activeDuckId, board, boardState]);

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
    (result: ReturnType<typeof placeDuck>, fallbackKey: string) => {
      if (result.lostHeart) {
        const key = result.row !== null && result.col !== null ? `${result.row},${result.col}` : fallbackKey;
        showTemporaryCells(setErrorCells, [key], 700);
        showTemporaryCells(setConflictCells, result.conflictCellKeys.length ? result.conflictCellKeys : [key], 1000);
        setFeedbackMessage(describeConflicts(result.conflicts));
        clearFeedbackLater();
        return;
      }

      if (!result.success && result.conflicts.length > 0) {
        const key = result.row !== null && result.col !== null ? `${result.row},${result.col}` : fallbackKey;
        showTemporaryCells(setConflictCells, result.conflictCellKeys.length ? result.conflictCellKeys : [key], 1000);
        setFeedbackMessage(describeConflicts(result.conflicts));
        clearFeedbackLater();
        return;
      }

      if (result.isCorrect && result.row !== null && result.col !== null) {
        showTemporaryCells(setCorrectCells, [`${result.row},${result.col}`], 800);
        if (!result.isComplete) {
          setFeedbackMessage('Correcto.');
          clearFeedbackLater(1200);
        }
        return;
      }

      if (result.success && playMode === 'murdoku') {
        setFeedbackMessage(canSubmitSolution ? 'Listo para acusar.' : 'Sospechoso colocado.');
        clearFeedbackLater(1200);
      }
    },
    [canSubmitSolution, placeDuck, playMode]
  );

  const placeDuckOnCell = useCallback(
    (row: number, col: number, duckId: string) => {
      const key = `${row},${col}`;
      if (blockedCells.has(key)) {
        showTemporaryCells(setConflictCells, [key], 900);
        setFeedbackMessage('Esa celda está tachada para este pato.');
        clearFeedbackLater();
        return;
      }

      const result = placeDuckAt(row, col, duckId);
      applyPlacementFeedback(result, key);
    },
    [applyPlacementFeedback, blockedCells, placeDuckAt]
  );

  const handlePlaceDuck = useCallback(
    (duckId: string) => {
      setActiveDuckId(duckId);
      if (selectedCell) {
        placeDuckOnCell(selectedCell.row, selectedCell.col, duckId);
        return;
      }

      setFeedbackMessage('Sospechoso seleccionado. Toca una casilla libre del tablero.');
      clearFeedbackLater(2000);
    },
    [placeDuckOnCell, selectedCell]
  );

  const handleFocusDuck = useCallback((duckId: string) => {
    setActiveDuckId(duckId);
    setHintCells(new Set());
  }, []);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (xMode) {
        const marked = toggleXMarkAt(row, col);
        if (!marked) {
          setFeedbackMessage('Solo puedes descartar casillas libres.');
          clearFeedbackLater();
        }
        return;
      }

      if (activeDuckId) {
        placeDuckOnCell(row, col, activeDuckId);
        return;
      }

      selectCell(row, col);
    },
    [activeDuckId, placeDuckOnCell, selectCell, toggleXMarkAt, xMode]
  );

  const handleBasicHint = useCallback(() => {
    const result = useBasicClue();
    if (!result) {
      Alert.alert('Sin pistas', 'No hay pistas disponibles o no quedan celdas vacías.');
      return;
    }

    showTemporaryCells(setHintCells, result.cellKeys, 2400);
    setFeedbackMessage(result.message);
    clearFeedbackLater(2600);
  }, [useBasicClue]);

  const handleRevealHint = useCallback(() => {
    const result = revealCellWithClue();
    if (!result) {
      Alert.alert('Sin pistas', 'No hay pistas disponibles o no quedan celdas vacías.');
      return;
    }

    const key = `${result.row},${result.col}`;
    showTemporaryCells(setCorrectCells, [key], 1000);
    setFeedbackMessage('Pista avanzada usada.');
    clearFeedbackLater();
  }, [revealCellWithClue]);

  const handleSubmitSolution = useCallback(() => {
    const result = submitSolution();

    if (result.isComplete) {
      return;
    }

    if (result.conflictCellKeys.length > 0) {
      showTemporaryCells(result.lostHeart ? setErrorCells : setConflictCells, result.conflictCellKeys, 1300);
    }

    setFeedbackMessage(result.message);
    clearFeedbackLater(2200);
  }, [submitSolution]);

  const handleContinue = () => {
    const success = spendCoins(100);
    if (success) {
      continueAfterGameOver(100);
    } else {
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

      {playMode === 'murdoku' && gameCase.logic_clues.length > 0 && (
        <View style={styles.cluePanel}>
          <Text style={styles.clueTitle}>Pistas del caso</Text>
          <ScrollView style={styles.clueScroll} showsVerticalScrollIndicator={false}>
            {gameCase.logic_clues.slice(0, 2).map((clue, index) => (
              <Text key={`${index}-${clue}`} style={styles.clueText}>
                {index + 1}. {clue}
              </Text>
            ))}
          </ScrollView>
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
        onUndo={undoLast}
        onBasicHint={handleBasicHint}
        onRevealHint={handleRevealHint}
        onSubmitSolution={handleSubmitSolution}
        onToggleXMode={toggleXMode}
        onToggleNotes={toggleNotes}
        suspectClues={gameCase.suspect_clues}
        xMode={xMode}
        notesMode={notesMode}
        canUndo={history.length > 0}
        canSubmitSolution={canSubmitSolution}
        cluesLeft={clues}
        activeDuckId={activeDuckId}
        lockCompletedDucks={playMode === 'latin'}
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

            <Text style={styles.culpritReveal}>
              La víctima era {victimDuck?.name ?? gameCase.victim}. {'\n'}
              El culpable era... {'\n'}
              <Text style={styles.culpritName}>
                {culpritDuck?.name ?? gameCase.culprit}
              </Text>
            </Text>
            {culpritDuck && <DuckAvatar duck={culpritDuck} size={96} style={styles.culpritAvatar} />}

            <View style={styles.rewardsRow}>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>+{gameCase.rewards.coins}</Text>
                <GameAsset name="coin" size={18} />
              </View>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>+{gameCase.rewards.xp} XP</Text>
              </View>
              {errors === 0 && (
                <View style={styles.rewardChip}>
                  <Text style={styles.rewardText}>+30 perfecto</Text>
                  <GameAsset name="coin" size={18} />
                </View>
              )}
            </View>

            <Button
              label="Volver a casos"
              onPress={() => { resetGame(); router.replace('/(tabs)/cases'); }}
              fullWidth
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Fonts.body,
    color: Colors.gray,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  pauseBtn: {
    padding: Spacing.xs,
  },
  pauseIcon: {
    fontSize: 22,
  },
  hudCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  caseTitle: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '600',
  },
  hudRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  timer: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  cluesHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  cluesHudText: {
    fontSize: Fonts.small,
    color: Colors.gray,
    fontWeight: '700',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cluePanel: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    maxHeight: 84,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.grayLight,
    padding: Spacing.sm,
    ...Shadow.card,
  },
  clueTitle: {
    fontSize: Fonts.xs,
    color: Colors.blackPremium,
    fontWeight: '800',
    marginBottom: 4,
  },
  clueScroll: {
    maxHeight: 48,
  },
  clueText: {
    fontSize: 11,
    color: Colors.gray,
    lineHeight: 16,
    marginBottom: 3,
  },
  feedbackBar: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.badge,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
  },
  feedbackText: {
    color: Colors.blackPremium,
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
