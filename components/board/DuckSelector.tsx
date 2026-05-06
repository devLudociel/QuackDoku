import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { DUCK_MAP } from '../../constants/ducks';
import { BoardState, countDuckPlacements } from '../../lib/boardValidator';
import type { SuspectClue } from '../../constants/cases';
import DuckAvatar from '../ui/DuckAvatar';

interface DuckSelectorProps {
  duckIds: string[];
  boardState: BoardState;
  duckTargetCount: number;
  onSelectDuck: (duckId: string) => void;
  onFocusDuck: (duckId: string) => void;
  onUndo: () => void;
  onBasicHint: () => void;
  onRevealHint: () => void;
  onSubmitSolution: () => void;
  onToggleXMode: () => void;
  onToggleNotes: () => void;
  suspectClues: SuspectClue[];
  xMode: boolean;
  notesMode: boolean;
  canUndo: boolean;
  canSubmitSolution: boolean;
  cluesLeft: number;
  activeDuckId: string | null;
  lockCompletedDucks: boolean;
}

interface DuckButtonProps {
  duckId: string;
  clue: string | null;
  isComplete: boolean;
  isLocked: boolean;
  isActive: boolean;
  onSelectDuck: (duckId: string) => void;
  onFocusDuck: (duckId: string) => void;
}

function DuckButton({
  duckId,
  clue,
  isComplete,
  isLocked,
  isActive,
  onSelectDuck,
  onFocusDuck,
}: DuckButtonProps) {
  const duck = DUCK_MAP[duckId];
  const pan = useRef(new Animated.ValueXY()).current;

  if (!duck) return null;

  return (
    <Pressable
      disabled={isLocked}
      onPressIn={() => onFocusDuck(duckId)}
      onPress={() => onSelectDuck(duckId)}
      style={[
        styles.duckBtn,
        isActive && styles.duckActive,
        isComplete && styles.duckComplete,
        isLocked && styles.duckLocked,
      ]}
    >
      <Animated.View style={[styles.duckContent, { transform: pan.getTranslateTransform() }]}>
        <DuckAvatar duck={duck} size={44} dimmed={isComplete} style={styles.duckAvatar} />
        {isComplete && (
          <View style={styles.checkOverlay}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
        <Text style={[styles.duckName, isComplete && styles.duckNameComplete]} numberOfLines={1}>
          {duck.name.split(' ')[0]}
        </Text>
        {clue && (
          <Text style={[styles.duckClue, isComplete && styles.duckNameComplete]} numberOfLines={3}>
            {clue}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function DuckSelector({
  duckIds,
  boardState,
  duckTargetCount,
  onSelectDuck,
  onFocusDuck,
  onUndo,
  onBasicHint,
  onRevealHint,
  onSubmitSolution,
  onToggleXMode,
  onToggleNotes,
  suspectClues,
  xMode,
  notesMode,
  canUndo,
  canSubmitSolution,
  cluesLeft,
  activeDuckId,
  lockCompletedDucks,
}: DuckSelectorProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);
  const clueLookup = useMemo(
    () => Object.fromEntries(suspectClues.map((clue) => [clue.duck_id, clue.clue])),
    [suspectClues]
  );
  const handleFocusDuck = (duckId: string) => {
    onFocusDuck(duckId);
  };

  const handleSelectDuck = (duckId: string) => {
    onSelectDuck(duckId);
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomInset + Spacing.sm }]}>
      {/* Controls row */}
      <View style={styles.controls}>
        <Pressable
          onPress={onToggleXMode}
          style={[styles.controlBtn, xMode && styles.activeControl]}
        >
          <Text style={styles.controlIcon}>X</Text>
          <Text style={styles.controlLabel}>Descartar</Text>
        </Pressable>

        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          style={[styles.controlBtn, !canUndo && styles.disabled]}
        >
          <Text style={styles.controlIcon}>↩</Text>
          <Text style={styles.controlLabel}>Deshacer</Text>
        </Pressable>

        <Pressable
          onPress={onToggleNotes}
          style={[styles.controlBtn, notesMode && styles.activeControl]}
        >
          <Text style={styles.controlIcon}>✏️</Text>
          <Text style={styles.controlLabel}>Notas</Text>
        </Pressable>

        <Pressable
          onPress={onBasicHint}
          disabled={cluesLeft <= 0}
          style={[styles.controlBtn, cluesLeft <= 0 && styles.disabled]}
        >
          <Text style={styles.controlIcon}>💡</Text>
          <Text style={styles.controlLabel}>Pista</Text>
        </Pressable>

        <Pressable
          onPress={onRevealHint}
          disabled={cluesLeft <= 0}
          style={[styles.controlBtn, cluesLeft <= 0 && styles.disabled]}
        >
          <Text style={styles.controlIcon}>🔍</Text>
          <Text style={styles.controlLabel}>Revelar ({cluesLeft})</Text>
        </Pressable>

        <Pressable
          onPress={onSubmitSolution}
          disabled={!canSubmitSolution}
          style={[styles.controlBtn, styles.submitBtn, !canSubmitSolution && styles.disabled]}
        >
          <Text style={styles.controlIcon}>⚖</Text>
          <Text style={styles.controlLabel}>Acusar</Text>
        </Pressable>
      </View>

      {/* Duck selector row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.duckRow}
      >
        {duckIds.map((duckId) => {
          const placedCount = countDuckPlacements(boardState, duckId);
          const isComplete = placedCount >= duckTargetCount;
          const isLocked = isComplete && lockCompletedDucks;

          return (
            <DuckButton
              key={duckId}
              duckId={duckId}
              clue={clueLookup[duckId] ?? null}
              isComplete={isComplete}
              isLocked={isLocked}
              isActive={activeDuckId === duckId}
              onSelectDuck={handleSelectDuck}
              onFocusDuck={handleFocusDuck}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
    paddingTop: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    marginBottom: Spacing.sm,
  },
  controlBtn: {
    flex: 1,
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.badge,
    minWidth: 0,
  },
  submitBtn: {
    backgroundColor: Colors.yellowSoft,
  },
  activeControl: {
    backgroundColor: Colors.yellowSoft,
  },
  disabled: {
    opacity: 0.3,
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    fontSize: 10,
    color: Colors.gray,
    marginTop: 2,
    fontWeight: '600',
  },
  duckRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  duckBtn: {
    width: 118,
    minHeight: 142,
    alignItems: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.grayLight,
    padding: Spacing.xs,
    position: 'relative',
  },
  duckContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  duckComplete: {
    backgroundColor: Colors.yellowSoft,
  },
  duckLocked: {
    opacity: 0.5,
    backgroundColor: Colors.grayLight,
  },
  duckActive: {
    backgroundColor: Colors.yellowSoft,
    borderColor: Colors.yellowPremium,
  },
  duckAvatar: {
    marginBottom: 2,
  },
  checkOverlay: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  checkText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: 'bold',
  },
  duckName: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '700',
  },
  duckNameComplete: {
    color: Colors.grayMuted,
  },
  duckClue: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    color: Colors.blackPremium,
    textAlign: 'center',
  },
});
