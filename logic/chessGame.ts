import { Chess } from "chess.js";

export const game = new Chess();

export const getLegalMoves = (square: string) => {
  const moves = game.moves({
    square: square as any,
    verbose: true,
  });

  return moves.map((move) => move.to);
};

export const movePiece = (from: string, to: string) => {
  return game.move({
    from,
    to,
    promotion: "q",
  });
};

export const getPieceAtSquare = (square: string) => {
  return game.get(square as any);
};

export const resetGame = () => {
  game.reset();
};

export const getFen = () => {
  return game.fen();
};

export const moveAiPiece = (from: string, to: string) => {
  return game.move({
    from,
    to,
    promotion: "q",
  });
};