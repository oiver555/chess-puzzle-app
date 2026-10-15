import React from "react";
import Svg, {
    Defs,
    LinearGradient,
    Marker,
    Path,
    Polygon,
    Stop,
} from "react-native-svg";
import { Square } from "chess.js";

type Props = {
    from: Square;
    to: Square;
    boardSize: number;
    playerColor: "w" | "b";
};

const getSquareCenter = (
    square: Square,
    boardSize: number,
    playerColor: "w" | "b"
) => {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]);

    const cell = boardSize / 8;

    const col = playerColor === "w" ? file : 7 - file;
    const row = playerColor === "w" ? 8 - rank : rank - 1;

    return {
        x: col * cell + cell / 2,
        y: row * cell + cell / 2,
    };
};

export default function HintArrow({
    from,
    to,
    boardSize,
    playerColor,
}: Props) {
    const start = getSquareCenter(from, boardSize, playerColor);
    const end = getSquareCenter(to, boardSize, playerColor);

    return (
        <Svg
            width={boardSize}
            height={boardSize}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                pointerEvents: "none",
            }}
        >
            <Defs>
                <LinearGradient id="hintGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#E53935" />
                    <Stop offset="55%" stopColor="#FF7A18" />
                    <Stop offset="100%" stopColor="#E53935" />
                </LinearGradient>

                <Marker
                    id="arrowhead"
                    markerWidth="3"
                    markerHeight="3"
                    refX="1.5"
                    refY="1.5"
                    orient="auto"
                >
                    <Polygon
                        points="0 0, 3 1.5, 0 3"
                         fill="#E53935"
                    />
                </Marker>
            </Defs>

            <Path
                d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                stroke="url(#hintGradient)"
                strokeWidth={8}
                strokeLinecap="butt"
                markerEnd="url(#arrowhead)"
            />
        </Svg>
    );
}