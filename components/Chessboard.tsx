import { Pressable, StyleSheet, Text, View } from "react-native";
import { Square } from "chess.js";
import { PieceCode } from "./Piece";
import AnimatedPiece from "./AnimatedPiece";
import { useState } from "react";
import { COLORS } from "../theme/colors";
import { ChessBoardProps } from "@/types/match";

export default function ChessBoard({
  selectedSquare,
  legalMoves,
  playerColor,
  isCheckmate,
  squareInCheck,
  getPieceAtSquare,
  onSquarePress,
  lastMove,
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

        const row = Math.floor(i / 8);
        const col = i % 8;
        const isDark = (row + col) % 2 === 1;

        return (
          <Pressable
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
                backgroundColor:
                  isCheckmate && squareInCheck === squareName
                    ? COLORS.board.check
                    : isDark ? COLORS.board.darkSquare : COLORS.board.lightSquare,
              },
              isSelected && { backgroundColor: COLORS.board.selected },
            ]}
            onPress={() => onSquarePress(squareName)}
          >
            {isLegalMove && <View style={styles.legalMoveDot} />}

            <Text style={styles.squareLabel}>{squareName}</Text>
          </Pressable>
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
    backgroundColor: COLORS.board.legalMove,
  },

  squareLabel: {
    position: "absolute",
    top: 4,
    left: 4,
    fontSize: 11,
    color: "#D9B46B",
    fontWeight: "700",
    opacity: 0.9,
  },
});