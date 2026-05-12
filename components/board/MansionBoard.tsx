import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
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
  onCellLongPress: (row: number, col: number) => void;
  onBoardLayout?: (layout: BoardScreenLayout) => void;
  maxBoardSize?: number;
}

export interface BoardScreenLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cellSize: number;
}

const BOARD_PADDING = 12;
const MAT_PADDING = 8;
const MIN_CELL_SIZE = 26;

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
  onCellLongPress,
  onBoardLayout,
  maxBoardSize,
}: MansionBoardProps) {
  const boardRef = useRef<View>(null);
  const { width: windowWidth } = useWindowDimensions();
  const outerLimit = Math.max(220, Math.min(maxBoardSize ?? windowWidth, windowWidth));
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.floor((outerLimit - BOARD_PADDING * 2 - MAT_PADDING * 2) / board.grid_size.cols)
  );

  const boardWidth = cellSize * board.grid_size.cols;
  const boardHeight = cellSize * board.grid_size.rows;
  const hasBackgroundImage = !!board.background_image;
  const noteLabelLookup = useMemo(
    () => Object.fromEntries(board.duck_ids.map((duckId, index) => [duckId, String.fromCharCode(65 + index)])),
    [board.duck_ids]
  );

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
    <View style={[styles.container, { width: boardWidth + MAT_PADDING * 2 + BOARD_PADDING * 2 }]}>
      <View style={styles.mat}>
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
        {hasBackgroundImage && board.background_image && (
          <Image
            source={board.background_image}
            style={{ position: 'absolute', top: 0, left: 0, width: boardWidth, height: boardHeight }}
            resizeMode="stretch"
          />
        )}

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
            const roomColor = hasBackgroundImage ? 'transparent' : roomColorLookup[key] ?? 'rgba(200,200,200,0.2)';
            const sceneObject = hasBackgroundImage ? null : sceneObjectLookup[key] ?? null;

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
                  borderTop={hasBackgroundImage ? false : isBorderThick(row, col, 'top')}
                  borderRight={hasBackgroundImage ? false : isBorderThick(row, col, 'right')}
                  borderBottom={hasBackgroundImage ? false : isBorderThick(row, col, 'bottom')}
                  borderLeft={hasBackgroundImage ? false : isBorderThick(row, col, 'left')}
                  cellSize={cellSize}
                  onPress={() => onCellPress(row, col)}
                  onLongPress={() => onCellLongPress(row, col)}
                  showError={showError}
                  showConflict={showConflict}
                  showCorrect={showCorrect}
                  showHint={showHint}
                  showBlocked={showBlocked}
                  sceneObject={sceneObject}
                  noteLabelLookup={noteLabelLookup}
                />
              </View>
            );
          })
        )}

        {/* Room labels (overlay) — skipped when the scene image already has them */}
        {!hasBackgroundImage && board.rooms.map((room) => (
          <RoomLabel
            key={room.room_id}
            room={room}
            cellSize={cellSize}
            boardRows={board.grid_size.rows}
            boardCols={board.grid_size.cols}
          />
        ))}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingHorizontal: BOARD_PADDING,
  },
  mat: {
    padding: MAT_PADDING,
    borderRadius: 18,
    backgroundColor: '#15152E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  board: {
    position: 'relative',
    backgroundColor: '#F3F1E9',
    borderRadius: 6,
    overflow: 'visible',
  },
});
