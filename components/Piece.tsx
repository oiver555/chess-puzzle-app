import React from "react"; 
import WK from "../assets/pieces/wK.svg";
import WQ from "../assets/pieces/wQ.svg";
import WR from "../assets/pieces/wR.svg";
import WB from "../assets/pieces/wB.svg";
import WN from "../assets/pieces/wN.svg";
import WP from "../assets/pieces/wP.svg"; 
import BK from "../assets/pieces/bK.svg";
import BQ from "../assets/pieces/bQ.svg";
import BR from "../assets/pieces/bR.svg";
import BB from "../assets/pieces/bB.svg";
import BN from "../assets/pieces/bN.svg";
import BP from "../assets/pieces/bP.svg";

export type  PieceCode =
  | "r" | "n" | "b" | "q" | "k" | "p"
  | "R" | "N" | "B" | "Q" | "K" | "P";

type Props = {
  code: PieceCode;
  size?: number;
};

const pieceMap = {
  r: BR,
  n: BN,
  b: BB,
  q: BQ,
  k: BK,
  p: BP,

  R: WR,
  N: WN,
  B: WB,
  Q: WQ,
  K: WK,
  P: WP,
};

const Piece = ({ code, size = 40 }: Props) => {
  const SvgPiece = pieceMap[code];

  if (!SvgPiece) return null;



  
  return <SvgPiece width={size} height={size} />;
};

export default Piece;