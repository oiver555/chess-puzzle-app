import React from "react";
import PBK from "../assets/pieces/png/bK.png";
import PBQ from "../assets/pieces/png/bQ.png";
import PBR from "../assets/pieces/png/bR.png";
import PBB from "../assets/pieces/png/bB.png";
import PBN from "../assets/pieces/png/bN.png";
import PBP from "../assets/pieces/png/bP.png";
import PWK from "../assets/pieces/png/wK.png";
import PWQ from "../assets/pieces/png/wQ.png";
import PWR from "../assets/pieces/png/wR.png";
import PWB from "../assets/pieces/png/wB.png";
import PWN from "../assets/pieces/png/wN.png";
import PWP from "../assets/pieces/png/wP.png";
import SWK from "../assets/pieces/svg/wK.svg";
import SWQ from "../assets/pieces/svg/wQ.svg";
import SWR from "../assets/pieces/svg/wR.svg";
import SWB from "../assets/pieces/svg/wB.svg";
import SWN from "../assets/pieces/svg/wN.svg";
import SWP from "../assets/pieces/svg/wP.svg";
import SBK from "../assets/pieces/svg/bK.svg";
import SBQ from "../assets/pieces/svg/bQ.svg";
import SBR from "../assets/pieces/svg/bR.svg";
import SBB from "../assets/pieces/svg/bB.svg";
import SBN from "../assets/pieces/svg/bN.svg";
import SBP from "../assets/pieces/svg/bP.svg";
import { Image } from "react-native";



export type PieceCode =
  | "r" | "n" | "b" | "q" | "k" | "p"
  | "R" | "N" | "B" | "Q" | "K" | "P";

type PieceStyle = "2D" | "3D";

type Props = {
  code: PieceCode;
  size?: number;
  variant?: PieceStyle;
};

const svgPieceMap: Record<PieceCode, React.ElementType> = {
  r: SBR,
  n: SBN,
  b: SBB,
  q: SBQ,
  k: SBK,
  p: SBP,

  R: SWR,
  N: SWN,
  B: SWB,
  Q: SWQ,
  K: SWK,
  P: SWP,
};

const pngPieceMap: Record<PieceCode, any> = {
  r: PBR,
  n: PBN,
  b: PBB,
  q: PBQ,
  k: PBK,
  p: PBP,

  R: PWR,
  N: PWN,
  B: PWB,
  Q: PWQ,
  K: PWK,
  P: PWP,
};

const Piece = ({ code, size = 40, variant = "2D" }: Props) => {
  if (variant === "2D") {
    const SvgPiece = svgPieceMap[code];
    if (!SvgPiece) return null;

    return <SvgPiece width={size} height={size} />;
  }

  const source = pngPieceMap[code];
  if (!source) return null;

  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        resizeMode: "contain",
      }}
    />
  );
};

export default Piece;