import { Chess, Square } from "chess.js";

export const game = new Chess();

export const getLegalMoves = (square: string) => {
  const moves = game.moves({
    square: square as any,
    verbose: true,
  });

  return moves.map((move) => move.to);
};

export const movePiece = (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
  return game.move({
    from,
    to,
    promotion: promotion,
  });
};

export const getPieceAtSquare = (square: string) => {
  return game.get(square as any);
};

export const resetGame = () => {
   console.log("Resetting Chess.js");
  game.reset();
};

export const getFen = () => {
  return game.fen();
};
export const getCurrentBoard = () => {
  return game.board();
};

export const moveAiPiece = (
  from: Square,
  to: Square,
  promotion?: "q" | "r" | "b" | "n"
) => {
  return game.move({
    from,
    to,
    ...(promotion ? { promotion } : {}),
  });
};