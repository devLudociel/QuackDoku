import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Room } from '../../constants/cases';
import { Colors } from '../../constants/theme';

interface RoomLabelProps {
  room: Room;
  cellSize: number;
  boardRows: number;
  boardCols: number;
}

/** Tints a `rgba(r,g,b,0.30)` room color string to a more opaque variant. */
function solidify(roomColor: string, alpha: string): string {
  return roomColor.replace(/0?\.\d+\)/, `${alpha})`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export default function RoomLabel({ room, cellSize, boardRows, boardCols }: RoomLabelProps) {
  // Anchor the pill on the region cell nearest the region's centroid, so it
  // sits inside the irregular area rather than over a neighbour.
  const cells = room.cells;
  if (cells.length === 0) return null;
  const avgRow = cells.reduce((s, c) => s + c.row, 0) / cells.length;
  const avgCol = cells.reduce((s, c) => s + c.col, 0) / cells.length;
  let anchor = cells[0];
  let bestDist = Infinity;
  for (const c of cells) {
    const d = (c.row - avgRow) ** 2 + (c.col - avgCol) ** 2;
    if (d < bestDist) {
      bestDist = d;
      anchor = c;
    }
  }

  const boardWidth = boardCols * cellSize;
  const boardHeight = boardRows * cellSize;
  const labelHeight = Math.max(20, Math.min(24, cellSize * 0.46));
  const preferredWidth = Math.max(cellSize * 1.35, room.room_name.length * 8 + 18);
  const labelWidth = Math.min(boardWidth - 4, preferredWidth, cellSize * 2.55);
  const left = clamp(anchor.col * cellSize + cellSize / 2 - labelWidth / 2, 2, boardWidth - labelWidth - 2);
  const top = clamp(anchor.row * cellSize + cellSize / 2 - labelHeight / 2, 2, boardHeight - labelHeight - 2);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        { top, left, width: labelWidth, height: labelHeight },
      ]}
    >
      <View style={[styles.pill, { borderColor: solidify(room.room_color, '0.55') }]}>
        <Text style={styles.text} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
          {room.room_name.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    borderWidth: 1.5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0,
    color: Colors.blackPremium,
  },
});
