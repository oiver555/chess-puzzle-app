import { Square } from "chess.js";

export type LastMove = {
  from: Square | null;
  to: Square | null;
} | null;

export type SavedMatchState = {
  fen: string;
  pgn: string;
  selectedSquare: Square | null;
  playerColor: "w" | "b";
  aiColor: "w" | "b";
  lastMove?: LastMove;
  savedAt: string;
  difficulty: Difficulty;
 
};



export type Difficulty = "rookie" | "skilled" | "advanced" | "master";

export type ChessBoardProps = {
  selectedSquare: Square | null;
  legalMoves: Square[];
  playerColor: "w" | "b";
  isCheckmate: boolean;
  squareInCheck: Square | "";
  getPieceAtSquare: (square: Square) => any;
  lastMove: LastMove;
  illegalSquare: Square | null;
  onSquarePressIn: (square: Square) => void;
  hintMove?: {
    from: Square;
    to: Square;
  } | null;
};

export type SavedAppState = {
  lastRoute: string;
  savedAt: string;
};
