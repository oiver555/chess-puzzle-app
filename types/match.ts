import { Square } from "chess.js";



export type LastMove = {
    from: Square;
    to: Square;
} | null;

export type SavedMatchState = {
    fen: string;
    playerColor: "w" | "b";
    aiColor: "w" | "b";
    lastMove?: LastMove;
    savedAt: string;
};


export type ChessBoardProps = {
    selectedSquare: Square | null;
    legalMoves: Square[];
    playerColor: "w" | "b";
    isCheckmate: boolean;
    squareInCheck: Square | "";
    getPieceAtSquare: (square: Square) => any;
    onSquarePress: (square: Square) => void;
    lastMove: LastMove;
};

export type SavedAppState = {
  lastRoute: string;
  savedAt: string;
};