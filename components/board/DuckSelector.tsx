import React, { useRef } from 'react';
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
  onSubmitSolution: () => void;
  canUndo: boolean;
  canSubmitSolution: boolean;
  cluesLeft: number;
  activeDuckId: string | null;
  lockCompletedDucks: boolean;
  duckLabels?: Record<string, string>;
  suspectClues: SuspectClue[];
}

interface DuckButtonProps {
  duckId: string;
  isComplete: boolean;
  isLocked: boolean;
  isActive: boolean;
  onSelectDuck: (duckId: string) => void;
  onFocusDuck: (duckId: string) => void;
  compact: boolean;
  label: string;
}

function shortDuckName(name: string): string {
  const parts = name.split(' ');
  if (parts[0] === 'Sr.' || parts[0] === 'Sra.') return parts[1] ?? name;
  return parts[0] ?? name;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(255,199,0,${alpha})`;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function DuckButton({
  duckId,
  isComplete,
  isLocked,
  isActive,
  onSelectDuck,
  onFocusDuck,
  compact,
  label,
}: DuckButtonProps) {
  const duck = DUCK_MAP[duckId];
  const pan = useRef(new Animated.ValueXY()).current;

  if (!duck) return null;

  const accent = duck.body_color || duck.hat_color || Colors.yellow;
  const borderColor = isActive ? duck.hat_color : hexToRgba(accent, 0.58);
  const backgroundColor = isActive ? hexToRgba(accent, 0.28) : hexToRgba(accent, 0.14);

  return (
    <Pressable
      disabled={isLocked}
      onPressIn={() => onFocusDuck(duckId)}
      onPress={() => onSelectDuck(duckId)}
      style={[
        styles.duckBtn,
        compact && styles.duckBtnCompact,
        { backgroundColor, borderColor },
        isActive && styles.duckActive,
        isComplete && styles.duckComplete,
        isLocked && styles.duckLocked,
      ]}
    >
      <View style={styles.duckLetterBadge}>
        <Text style={styles.duckLetterText}>{label}</Text>
      </View>
      <Animated.View style={[styles.duckContent, { transform: pan.getTranslateTransform() }]}>
        <View style={[styles.avatarHalo, compact && styles.avatarHaloCompact, { backgroundColor: hexToRgba(accent, 0.22) }]}>
          <DuckAvatar duck={duck} size={compact ? 38 : 48} dimmed={isComplete} style={styles.duckAvatar} />
        </View>
        {isComplete && (
          <View style={styles.checkOverlay}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
        <Text style={[styles.duckName, isComplete && styles.duckNameComplete]} numberOfLines={1}>
          {shortDuckName(duck.name)}
        </Text>
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
  onSubmitSolution,
  canUndo,
  canSubmitSolution,
  cluesLeft,
  activeDuckId,
  lockCompletedDucks,
  duckLabels,
  suspectClues,
}: DuckSelectorProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 0);
  const compact = duckIds.length > 6 || width < 390;
  const activeDuck = activeDuckId ? DUCK_MAP[activeDuckId] : null;
  const activeClue = activeDuckId
    ? suspectClues.find((clue) => clue.duck_id === activeDuckId)?.clue ?? null
    : null;
  const activeLabel = activeDuckId
    ? duckLabels?.[activeDuckId] ?? String.fromCharCode(65 + Math.max(0, duckIds.indexOf(activeDuckId)))
    : null;
  const handleFocusDuck = (duckId: string) => {
    onFocusDuck(duckId);
  };

  const handleSelectDuck = (duckId: string) => {
    onSelectDuck(duckId);
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomInset + Spacing.xs }]}>
      {activeDuck && activeClue && (
        <View style={styles.characterCluePanel}>
          <View style={styles.characterClueBadge}>
            <Text style={styles.characterClueBadgeText}>{activeLabel}</Text>
          </View>
          <DuckAvatar duck={activeDuck} size={28} />
          <Text style={styles.characterClueText} numberOfLines={2}>
            {activeClue}
          </Text>
        </View>
      )}

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
              isComplete={isComplete}
              isLocked={isLocked}
              isActive={activeDuckId === duckId}
              onSelectDuck={handleSelectDuck}
              onFocusDuck={handleFocusDuck}
              compact={compact}
              label={duckLabels?.[duckId] ?? String.fromCharCode(65 + index)}
            />
          );
        })}
      </ScrollView>

      <View style={styles.controls}>
        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          style={[styles.controlBtn, !canUndo && styles.disabled]}
        >
          <Text style={styles.controlIcon}>↩</Text>
          <Text style={styles.controlLabel}>Deshacer</Text>
        </Pressable>

        <Pressable
          onPress={onBasicHint}
          disabled={cluesLeft <= 0}
          style={[styles.controlBtn, styles.hintBtn, cluesLeft <= 0 && styles.disabled]}
        >
          <GameAsset name="clue" size={22} />
          <Text style={styles.controlLabel}>Pista × {cluesLeft}</Text>
        </Pressable>

        <Pressable
          onPress={onSubmitSolution}
          disabled={!canSubmitSolution}
          style={[styles.controlBtn, styles.submitBtn, !canSubmitSolution && styles.disabled]}
        >
          <Text style={[styles.controlIcon, styles.submitIcon]}>⚖</Text>
          <Text style={[styles.controlLabel, styles.submitLabel]}>Acusar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F0F23',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,199,0,0.22)',
    paddingTop: 6,
  },
  characterCluePanel: {
    minHeight: 40,
    marginHorizontal: Spacing.md,
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.42)',
    backgroundColor: 'rgba(255,199,0,0.09)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  characterClueBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.yellow,
  },
  characterClueBadgeText: {
    color: Colors.blackPremium,
    fontSize: 11,
    fontWeight: '900',
  },
  characterClueText: {
    flex: 1,
    color: Colors.whiteMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: 3,
  },
  controlBtn: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216,216,232,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.sm,
    minWidth: 0,
  },
  hintBtn: {
    backgroundColor: 'rgba(255,199,0,0.12)',
    borderColor: 'rgba(255,199,0,0.40)',
  },
  submitBtn: {
    backgroundColor: Colors.yellow,
    borderColor: Colors.yellow,
  },
  disabled: {
    opacity: 0.3,
  },
  controlIcon: {
    fontSize: 18,
    color: Colors.whiteMuted,
  },
  controlLabel: {
    fontSize: 11,
    color: Colors.whiteMuted,
    fontWeight: '900',
  },
  submitIcon: {
    color: Colors.blackPremium,
  },
  submitLabel: {
    color: Colors.blackPremium,
  },
  duckRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
    paddingBottom: 3,
  },
  duckBtn: {
    width: 78,
    minHeight: 78,
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 2,
    padding: Spacing.xs,
    position: 'relative',
  },
  duckLetterBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F23',
    borderWidth: 1,
    borderColor: 'rgba(255,199,0,0.52)',
  },
  duckLetterText: {
    fontSize: 10,
    color: Colors.yellow,
    fontWeight: '900',
  },
  duckBtnCompact: {
    width: 70,
    minHeight: 70,
  },
  duckContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  avatarHalo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarHaloCompact: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  duckComplete: {
    backgroundColor: 'rgba(32,184,90,0.16)',
    borderColor: 'rgba(32,184,90,0.58)',
  },
  duckLocked: {
    opacity: 0.46,
  },
  duckActive: {
    borderColor: Colors.yellow,
  },
  duckAvatar: {
    marginBottom: 0,
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
    color: Colors.whiteMuted,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '900',
  },
  duckNameComplete: {
    color: Colors.grayMuted,
  },
});
