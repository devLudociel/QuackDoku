import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { DUCK_MAP } from '../../constants/ducks';
import { BoardState, countDuckPlacements } from '../../lib/boardValidator';
import type { SuspectClue } from '../../constants/cases';
import DuckAvatar from '../ui/DuckAvatar';
import GameAsset from '../ui/GameAsset';

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
  compact: boolean;
  showInlineClue: boolean;
  label: string;
}

function shortDuckName(name: string): string {
  const parts = name.split(' ');
  if (parts[0] === 'Sr.' || parts[0] === 'Sra.') return parts[1] ?? name;
  return parts[0] ?? name;
}

function DuckButton({
  duckId,
  clue,
  isComplete,
  isLocked,
  isActive,
  onSelectDuck,
  onFocusDuck,
  compact,
  showInlineClue,
  label,
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
        compact && styles.duckBtnCompact,
        isActive && styles.duckActive,
        isComplete && styles.duckComplete,
        isLocked && styles.duckLocked,
      ]}
    >
      <View style={styles.duckLetterBadge}>
        <Text style={styles.duckLetterText}>{label}</Text>
      </View>
      <Animated.View style={[styles.duckContent, { transform: pan.getTranslateTransform() }]}>
        <DuckAvatar duck={duck} size={compact ? 36 : 44} dimmed={isComplete} style={styles.duckAvatar} />
        {isComplete && (
          <View style={styles.checkOverlay}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
        <Text style={[styles.duckName, isComplete && styles.duckNameComplete]} numberOfLines={1}>
          {shortDuckName(duck.name)}
        </Text>
        {clue && showInlineClue && (
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
  const { width } = useWindowDimensions();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);
  const clueLookup = useMemo(
    () => Object.fromEntries(suspectClues.map((clue) => [clue.duck_id, clue.clue])),
    [suspectClues]
  );
  const compact = duckIds.length > 6 || width < 390;
  const showInlineClues = !compact && suspectClues.length > 0;
  const activeDuck = activeDuckId ? DUCK_MAP[activeDuckId] : null;
  const activeClue = activeDuckId ? clueLookup[activeDuckId] ?? null : null;
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
          <GameAsset name="clue" size={24} />
          <Text style={styles.controlLabel}>Pista</Text>
        </Pressable>

        <Pressable
          onPress={onRevealHint}
          disabled={cluesLeft <= 0}
          style={[styles.controlBtn, cluesLeft <= 0 && styles.disabled]}
        >
          <GameAsset name="clue" size={24} />
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

      {activeDuck && activeClue && !showInlineClues && (
        <View style={styles.activeCluePanel}>
          <DuckAvatar duck={activeDuck} size={30} />
          <View style={styles.activeClueCopy}>
            <Text style={styles.activeClueName} numberOfLines={1}>
              {activeDuck.name}
            </Text>
            <Text style={styles.activeClueText} numberOfLines={2}>
              {activeClue}
            </Text>
          </View>
        </View>
      )}

      {/* Duck selector row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.duckRow}
      >
        {duckIds.map((duckId, index) => {
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
              compact={compact}
              showInlineClue={showInlineClues}
              label={String.fromCharCode(65 + index)}
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
    paddingTop: Spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    marginBottom: Spacing.xs,
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
    width: 112,
    minHeight: 132,
    alignItems: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: Radius.card,
    borderWidth: 2,
    borderColor: Colors.grayLight,
    padding: Spacing.xs,
    position: 'relative',
  },
  duckLetterBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  duckLetterText: {
    fontSize: 11,
    color: Colors.blackPremium,
    fontWeight: '900',
  },
  duckBtnCompact: {
    width: 88,
    minHeight: 88,
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
  activeCluePanel: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.badge,
    borderWidth: 1,
    borderColor: Colors.grayLight,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  activeClueCopy: {
    flex: 1,
    minWidth: 0,
  },
  activeClueName: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: '800',
  },
  activeClueText: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.blackPremium,
    fontWeight: '600',
  },
});
