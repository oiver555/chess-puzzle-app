import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react"; import { Square } from "chess.js";
import { PieceCode } from "./Piece";
import AnimatedPiece from "./AnimatedPiece";
import { COLORS } from "../theme/colors";
import { ChessBoardProps } from "@/types/match";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChessBoard({
  selectedSquare,
  legalMoves,
  playerColor,
  squareInCheck,
  getPieceAtSquare,
  onSquarePress,
  lastMove,
  illegalSquare,
  onSquarePressIn
}: ChessBoardProps) {
  const [boardSize, setBoardSize] = useState(0);

  const indexToSquare = (i: number): Square => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
    const row = Math.floor(i / 8);
    const col = i % 8;

    if (playerColor === "w") {
      return `${files[col]}${8 - row}` as Square;
    }

    const flippedFiles = [...files].reverse();
    return `${flippedFiles[col]}${row + 1}` as Square;
  };

  const squareToCoords = (square: Square) => {
    const file = square[0];
    const rank = Number(square[1]);

    const files =
      playerColor === "w"
        ? ["a", "b", "c", "d", "e", "f", "g", "h"]
        : ["h", "g", "f", "e", "d", "c", "b", "a"];

    const col = files.indexOf(file);
    const row = playerColor === "w" ? 8 - rank : rank - 1;

    const squareSize = boardSize / 8;

    return {
      x: col * squareSize,
      y: row * squareSize,
    };
  };

  const checkFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!squareInCheck) {
      checkFlash.setValue(0);
      return;
    }

    checkFlash.setValue(0);

    Animated.sequence([
      Animated.timing(checkFlash, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(checkFlash, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(checkFlash, {
        toValue: 1,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(checkFlash, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }),
      Animated.timing(checkFlash, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  }, [squareInCheck]);

  const squares = Array.from({ length: 64 });

  const pieces = squares
    .map((_, i) => {
      const squareName = indexToSquare(i);
      const chessPiece = getPieceAtSquare(squareName);


      if (!chessPiece) return null;

      const code: PieceCode =
        chessPiece.color === "w"
          ? (chessPiece.type.toUpperCase() as PieceCode)
          : (chessPiece.type as PieceCode);

      const { x, y } = squareToCoords(squareName);
      const pieceKey =
        lastMove && squareName === lastMove.to
          ? `${code}-${lastMove.from}`
          : `${code}-${squareName}`;

      return {
        key: pieceKey,
        code,
        square: squareName,
        x,
        y,
      };
    })
    .filter(Boolean) as {
      key: string;
      code: PieceCode;
      square: Square;
      x: number;
      y: number;
    }[];


  const pieceSize = boardSize / 8;
  const computerColor = playerColor === "w" ? "b" : "w";

  const lastMovedPiece = lastMove
    ? getPieceAtSquare(lastMove.to)
    : null;

  const wasComputerMove =
    lastMovedPiece?.color === computerColor;

  return (
    <View style={[styles.board, boardSize > 0 && { height: boardSize }]}
      onLayout={(event) => {
        setBoardSize(event.nativeEvent.layout.width);
      }}
    >
      {squares.map((_, i) => {
        const squareName = indexToSquare(i);
        const isSelected = selectedSquare === squareName;
        const isLegalMove = legalMoves.includes(squareName);
        const isCheckedSquare = squareName === squareInCheck;
        const row = Math.floor(i / 8);
        const col = i % 8;
        const isDark = (row + col) % 2 === 1;

        const isIllegalSquare = illegalSquare === squareName;


        const isLastMoveFrom =
          wasComputerMove && lastMove?.from === squareName;

        const isLastMoveTo =
          wasComputerMove && lastMove?.to === squareName;


        const checkedBackground = checkFlash.interpolate({
          inputRange: [0, 1],
          outputRange: [
            isDark ? COLORS.board.darkSquare : COLORS.board.lightSquare,
            COLORS.board.check,
          ],
        });

        return (
          <AnimatedPressable
            key={squareName}
            style={[
              styles.square,
              boardSize > 0 && {
                width: boardSize / 8,
                height: boardSize / 8,
                left: col * (boardSize / 8),
                top: row * (boardSize / 8),
              },
              {
                backgroundColor: isDark
                  ? COLORS.board.darkSquare
                  : COLORS.board.lightSquare,
              },
            ]}
            onPress={() => onSquarePress(squareName)}
            onPressIn={() => onSquarePressIn(squareName)}
          >
            {isLegalMove && <View style={styles.legalMoveDot} />}
            {isLastMoveFrom && (<View style={[styles.fill, { backgroundColor: COLORS.board.lastFromMove, borderWidth: 3, borderColor: "yellow", }]} />)}
            {isLastMoveTo && (<View style={[styles.fill, { backgroundColor: COLORS.board.lastToMove, borderWidth: 3, borderColor: "yellow", }]} />)}
            {isCheckedSquare && (<Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: checkedBackground,
                },
              ]}
            />
            )}
            {isIllegalSquare && (
              <View style={[styles.fill, { backgroundColor: COLORS.board.check }]} />
            )}
            {isSelected && (
              <View style={[styles.fill, { backgroundColor: COLORS.board.selected, borderWidth: 3, borderColor: COLORS.board.selectedBorder, }]} />
            )}
            <Text style={styles.squareLabel}>{squareName}</Text>
          </AnimatedPressable>
        );
      })}

      {boardSize > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {pieces.map((piece, index) => (
            <AnimatedPiece
              key={piece.key}
              code={piece.code}
              x={piece.x}
              y={piece.y}
              size={pieceSize}
            />
          ))}
        </View>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  board: {
    width: "100%",
    position: "relative",
    // borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.board.border,
    backgroundColor: COLORS.background,
  },
  fill: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  square: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  legalMoveDot: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.board.selected,
    zIndex: 2,
  },

  squareLabel: {
    position: "absolute",
    top: 4,
    left: 4,
    fontSize: 11,
    color: "#D9B46B",
    fontWeight: "700",
    opacity: 0.9,
    zIndex: 3
  },
});