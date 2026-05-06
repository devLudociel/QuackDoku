import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Room } from '../../constants/cases';
import { Fonts, Colors } from '../../constants/theme';

interface RoomLabelProps {
  room: Room;
  cellSize: number;
}

export default function RoomLabel({ room, cellSize }: RoomLabelProps) {
  // Keep the label inside the room bounding box; irregular rooms do not have a single exact center cell.
  const rows = room.cells.map((c) => c.row);
  const cols = room.cells.map((c) => c.col);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const width = (maxCol - minCol + 1) * cellSize;
  const top = ((minRow + maxRow + 1) / 2) * cellSize - 8;
  const left = minCol * cellSize;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.label,
        {
          top,
          left,
          width,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: room.room_color.replace('0.30', '0.8') },
        ]}
        numberOfLines={1}
      >
        {room.room_name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  text: {
    fontSize: Fonts.xs,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
