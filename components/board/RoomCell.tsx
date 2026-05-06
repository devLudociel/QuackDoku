import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { DUCK_MAP } from '../../constants/ducks';
import { CellState } from '../../lib/boardValidator';
import type { SceneObject } from '../../constants/cases';
import DuckAvatar from '../ui/DuckAvatar';

interface RoomCellProps {
  row: number;
  col: number;
  state: CellState;
  roomColor: string;
  isSelected: boolean;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  cellSize: number;
  onPress: () => void;
  showError: boolean;
  showConflict: boolean;
  showCorrect: boolean;
  showHint: boolean;
  showBlocked: boolean;
  sceneObject: SceneObject | null;
}

const OBJECT_ICON: Record<SceneObject['object_type'], string> = {
  table: '▰',
  chair: '🪑',
  plant: '🪴',
  shelf: '▤',
  rug: '▭',
};

const RoomCell = React.memo(function RoomCell({
  row,
  col,
  state,
  roomColor,
  isSelected,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  cellSize,
  onPress,
  showError,
  showConflict,
  showCorrect,
  showHint,
  showBlocked,
  sceneObject,
}: RoomCellProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showError) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [showError, shakeAnim]);

  useEffect(() => {
    if (state.duck_id && state.is_correct && !state.is_fixed) {
      // Pop animation on correct placement
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [state.duck_id, state.is_correct, scaleAnim]);

  const duck = state.duck_id ? DUCK_MAP[state.duck_id] : null;

  const bgColor = showError
    ? Colors.cellError
    : showConflict
    ? Colors.cellConflict
    : showCorrect
    ? Colors.cellCorrect
    : isSelected
    ? Colors.yellowSoft
    : state.x_mark
    ? 'rgba(255,255,255,0.82)'
    : showBlocked
    ? 'rgba(255,255,255,0.72)'
    : showHint
    ? Colors.cellHint
    : state.is_fixed
    ? Colors.cellFixed
    : roomColor;

  const borderStyle = {
    borderTopWidth: borderTop ? 3 : 1,
    borderRightWidth: borderRight ? 3 : 1,
    borderBottomWidth: borderBottom ? 3 : 1,
    borderLeftWidth: borderLeft ? 3 : 1,
    borderTopColor: borderTop ? Colors.boardBorderRoom : Colors.boardBorderInner,
    borderRightColor: borderRight ? Colors.boardBorderRoom : Colors.boardBorderInner,
    borderBottomColor: borderBottom ? Colors.boardBorderRoom : Colors.boardBorderInner,
    borderLeftColor: borderLeft ? Colors.boardBorderRoom : Colors.boardBorderInner,
  };

  return (
    <Pressable onPress={onPress} disabled={state.is_fixed} style={{ width: cellSize, height: cellSize }}>
      <Animated.View
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: bgColor,
            transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
          },
          borderStyle,
          isSelected && styles.selectedBorder,
          showHint && styles.hintBorder,
          showCorrect && styles.correctBorder,
        ]}
      >
        {duck && <DuckAvatar duck={duck} size={cellSize * 0.72} />}

        {!duck && sceneObject && !state.x_mark && state.notes.length === 0 && (
          <View style={styles.objectContainer}>
            <Text style={[styles.objectIcon, { fontSize: cellSize * 0.38 }]}>
              {OBJECT_ICON[sceneObject.object_type]}
            </Text>
          </View>
        )}

        {/* Notes mode: show candidate ducks */}
        {!duck && !state.x_mark && state.notes.length > 0 && (
          <View style={styles.notesContainer}>
            {state.notes.slice(0, 4).map((noteId) => (
              <Text key={noteId} style={styles.noteEmoji}>
                {DUCK_MAP[noteId]?.emoji ?? '?'}
              </Text>
            ))}
          </View>
        )}

        {!duck && state.x_mark && (
          <Text style={[styles.xMark, { fontSize: cellSize * 0.7 }]}>X</Text>
        )}

        {!duck && !state.x_mark && showBlocked && (
          <Text style={[styles.blockedMark, { fontSize: cellSize * 0.46 }]}>X</Text>
        )}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedBorder: {
    borderWidth: 3,
    borderColor: Colors.yellow,
  },
  hintBorder: {
    borderWidth: 3,
    borderColor: Colors.yellowPremium,
  },
  correctBorder: {
    borderWidth: 3,
    borderColor: Colors.success,
  },
  objectContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectIcon: {
    color: 'rgba(18,18,18,0.46)',
    fontWeight: '800',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
    gap: 1,
  },
  noteEmoji: {
    fontSize: 8,
    lineHeight: 10,
  },
  blockedMark: {
    color: Colors.error,
    fontWeight: '900',
    opacity: 0.72,
  },
  xMark: {
    color: Colors.blackPremium,
    fontWeight: '900',
    opacity: 0.92,
  },
});

export default RoomCell;
