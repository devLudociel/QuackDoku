import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BoardData } from '../../constants/cases';
import { BoardState, buildRoomLookup } from '../../lib/boardValidator';
import RoomCell from './RoomCell';
import RoomLabel from './RoomLabel';

interface MansionBoardProps {
  board: BoardData;
  boardState: BoardState;
  selectedCell: { row: number; col: number } | null;
  errorCells: Set<string>; // "row,col" keys
  conflictCells: Set<string>;
  correctCells: Set<string>;
  hintCells: Set<string>;
  blockedCells: Set<string>;
  onCellPress: (row: number, col: number) => void;
  onBoardLayout?: (layout: BoardScreenLayout) => void;
}

export interface BoardScreenLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 16;

export default function MansionBoard({
  board,
  boardState,
  selectedCell,
  errorCells,
  conflictCells,
  correctCells,
  hintCells,
  blockedCells,
  onCellPress,
  onBoardLayout,
}: MansionBoardProps) {
  const boardRef = useRef<View>(null);
  const cellSize = Math.floor(
    (SCREEN_WIDTH - BOARD_PADDING * 2) / board.grid_size.cols
  );

  const boardWidth = cellSize * board.grid_size.cols;
  const boardHeight = cellSize * board.grid_size.rows;

  const reportBoardLayout = () => {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      onBoardLayout?.({ x, y, width, height, cellSize });
    });
  };

  // Build room color lookup
  const roomColorLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    for (const room of board.rooms) {
      for (const cell of room.cells) {
        lookup[`${cell.row},${cell.col}`] = room.room_color;
      }
    }
    return lookup;
  }, [board]);

  // Build room membership lookup
  const roomLookup = useMemo(() => buildRoomLookup(board), [board]);

  const sceneObjectLookup = useMemo(() => {
    const lookup: Record<string, NonNullable<BoardData['scene_objects']>[number]> = {};
    for (const object of board.scene_objects ?? []) {
      lookup[`${object.row},${object.col}`] = object;
    }
    return lookup;
  }, [board]);

  // Determine border widths: thick if adjacent cells are in different rooms
  function isBorderThick(row: number, col: number, direction: 'top' | 'right' | 'bottom' | 'left'): boolean {
    const currentRoom = roomLookup[`${row},${col}`];
    let neighborRow = row;
    let neighborCol = col;

    if (direction === 'top') neighborRow -= 1;
    else if (direction === 'bottom') neighborRow += 1;
    else if (direction === 'left') neighborCol -= 1;
    else if (direction === 'right') neighborCol += 1;

    // Edge of board → thick
    if (
      neighborRow < 0 ||
      neighborRow >= board.grid_size.rows ||
      neighborCol < 0 ||
      neighborCol >= board.grid_size.cols
    ) {
      return true;
    }

    const neighborRoom = roomLookup[`${neighborRow},${neighborCol}`];
    return currentRoom !== neighborRoom;
  }

  return (
    <View style={[styles.container, { width: boardWidth + BOARD_PADDING * 2 }]}>
      <View
        ref={boardRef}
        onLayout={reportBoardLayout}
        style={[
          styles.board,
          {
            width: boardWidth,
            height: boardHeight,
          },
        ]}
      >
        {/* Cells */}
        {Array.from({ length: board.grid_size.rows }, (_, row) =>
          Array.from({ length: board.grid_size.cols }, (_, col) => {
            const key = `${row},${col}`;
            const cellState = boardState[row]?.[col];
            if (!cellState) return null;

            const isSelected = selectedCell?.row === row && selectedCell?.col === col;
            const showError = errorCells.has(key);
            const showConflict = conflictCells.has(key);
            const showCorrect = correctCells.has(key);
            const showHint = hintCells.has(key);
            const showBlocked = blockedCells.has(key);
            const roomColor = roomColorLookup[key] ?? 'rgba(200,200,200,0.2)';
            const sceneObject = sceneObjectLookup[key] ?? null;

            return (
              <View
                key={key}
                style={{
                  position: 'absolute',
                  top: row * cellSize,
                  left: col * cellSize,
                }}
              >
                <RoomCell
                  row={row}
                  col={col}
                  state={cellState}
                  roomColor={roomColor}
                  isSelected={isSelected}
                  borderTop={isBorderThick(row, col, 'top')}
                  borderRight={isBorderThick(row, col, 'right')}
                  borderBottom={isBorderThick(row, col, 'bottom')}
                  borderLeft={isBorderThick(row, col, 'left')}
                  cellSize={cellSize}
                  onPress={() => onCellPress(row, col)}
                  showError={showError}
                  showConflict={showConflict}
                  showCorrect={showCorrect}
                  showHint={showHint}
                  showBlocked={showBlocked}
                  sceneObject={sceneObject}
                />
              </View>
            );
          })
        )}

        {/* Room labels (overlay) */}
        {board.rooms.map((room) => (
          <RoomLabel key={room.room_id} room={room} cellSize={cellSize} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingHorizontal: BOARD_PADDING,
  },
  board: {
    position: 'relative',
  },
});
