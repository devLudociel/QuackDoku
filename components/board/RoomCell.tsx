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
  roomBorderColor: string;
  isSelected: boolean;
  borderTop: boolean;
  borderRight: boolean;
  borderBottom: boolean;
  borderLeft: boolean;
  cellSize: number;
  onPress: () => void;
  onLongPress: () => void;
  showError: boolean;
  showConflict: boolean;
  showCorrect: boolean;
  showHint: boolean;
  showBlocked: boolean;
  sceneObject: SceneObject | null;
  noteLabelLookup: Record<string, string>;
}

const OBJECT_ICON: Record<SceneObject['object_type'], string> = {
  table: '🛋️',
  chair: '🪑',
  plant: '🪴',
  shelf: '📚',
  rug: '🟫',
};

const RoomCell = React.memo(function RoomCell({
  row,
  col,
  state,
  roomColor,
  roomBorderColor,
  isSelected,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  cellSize,
  onPress,
  onLongPress,
  showError,
  showConflict,
  showCorrect,
  showHint,
  showBlocked,
  sceneObject,
  noteLabelLookup,
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
  const isSceneCell = roomColor === 'transparent';

  const bgColor = showError
    ? 'rgba(232,72,85,0.36)'
    : showConflict
    ? 'rgba(232,72,85,0.25)'
    : showCorrect
    ? 'rgba(32,184,90,0.28)'
    : isSelected
    ? 'rgba(255,199,0,0.30)'
    : state.x_mark
    ? isSceneCell ? 'rgba(255,255,255,0.36)' : 'rgba(255,255,255,0.10)'
    : showBlocked
    ? isSceneCell ? 'transparent' : 'rgba(30,136,229,0.12)'
    : showHint
    ? 'rgba(8,48,110,0.62)'
    : state.is_fixed
    ? isSceneCell ? Colors.cellFixed : 'rgba(255,255,255,0.12)'
    : roomColor;

  const borderStyle = isSceneCell
    ? {
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderColor: 'transparent',
      }
    : {
        borderTopWidth: borderTop ? 4 : 1,
        borderRightWidth: borderRight ? 4 : 1,
        borderBottomWidth: borderBottom ? 4 : 1,
        borderLeftWidth: borderLeft ? 4 : 1,
        borderTopColor: borderTop ? roomBorderColor : 'rgba(255,255,255,0.16)',
        borderRightColor: borderRight ? roomBorderColor : 'rgba(255,255,255,0.16)',
        borderBottomColor: borderBottom ? roomBorderColor : 'rgba(255,255,255,0.16)',
        borderLeftColor: borderLeft ? roomBorderColor : 'rgba(255,255,255,0.16)',
      };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}
      disabled={state.is_fixed}
      style={{ width: cellSize, height: cellSize }}
    >
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
            <Text style={[styles.objectIcon, { fontSize: cellSize * 0.42 }]}>
              {OBJECT_ICON[sceneObject.object_type]}
            </Text>
          </View>
        )}

        {/* Notes mode: show candidate ducks */}
        {!duck && !state.x_mark && state.notes.length > 0 && (
          <View style={styles.notesContainer}>
            {state.notes.slice(0, 4).map((noteId) => (
              <Text key={noteId} style={styles.noteEmoji}>
                {noteLabelLookup[noteId] ?? '?'}
              </Text>
            ))}
          </View>
        )}

        {!duck && state.x_mark && (
          <Text style={[styles.xMark, { fontSize: cellSize * 0.76 }]}>✕</Text>
        )}

        {!duck && !state.x_mark && showBlocked && (
          <Text style={[styles.blockedMark, isSceneCell && styles.blockedMarkScene, { fontSize: cellSize * (isSceneCell ? 0.48 : 0.42) }]}>✕</Text>
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
    borderColor: '#061D4F',
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
    opacity: 0.5,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    gap: 2,
  },
  noteEmoji: {
    minWidth: 10,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    color: Colors.yellow,
    fontWeight: '900',
  },
  blockedMark: {
    color: '#050505',
    fontWeight: '900',
    opacity: 0.98,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  blockedMarkScene: {
    color: '#050505',
    fontWeight: '900',
    opacity: 0.98,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xMark: {
    color: '#050505',
    fontWeight: '900',
    opacity: 0.98,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RoomCell;
