import React, { useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, } from "react-native"
import { useAudioPlayer } from "expo-audio";
import { useStockfish } from "@loloof64/react-native-stockfish";
import {
    getLegalMoves,
    movePiece,
    getPieceAtSquare,
    getFen,
    moveAiPiece,
} from "../logic/chessGame";
import Piece, { PieceCode } from "./Piece";

const moveSound = require("../assets/sounds/move-self.mp3");


const screenWidth = Dimensions.get("window").width;
const boardSize = screenWidth;
const squareSize = boardSize / 8;

const Chessboard = () => {
    const movePlayer = useAudioPlayer(moveSound);
    const [selectedSquare, setSelectedSquare] = React.useState<string | null>(null);
    const [legalMoves, setLegalMoves] = React.useState<string[]>([]);
    const [refresh, setRefresh] = React.useState(0);

    const indexToSquare = (i: number) => {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const row = Math.floor(i / 8);
        const col = i % 8;
        const rank = 8 - row;

        return `${files[col]}${rank}`;
    };

    const makeAiMove = async () => {


        const fen = getFen();
        // console.log("MakeAiMove", fen);
        sendCommandToStockfish(`position fen ${fen}`);
        sendCommandToStockfish("go movetime 1000");


    };

    const waitingForBestMove = React.useRef(false);

    const { stockfishLoop, stopStockfish, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
            const cleanOutput = output.trim();

            // console.log("Stockfish:", cleanOutput);

            if (cleanOutput === "bestmove") {
                waitingForBestMove.current = true;
                return;
            }

            if (waitingForBestMove.current) {
                const match = cleanOutput.match(/^([a-h][1-8][a-h][1-8][qrbn]?)$/);
                // console.log("Match", match);
                if (match) {
                    const bestMove = match[1];

                    const from = bestMove.slice(0, 2);
                    const to = bestMove.slice(2, 4);
                    // console.log("AI moving:", from, to);
                    moveAiPiece(from, to);
                    setRefresh((prev) => prev + 1);
                }

                waitingForBestMove.current = false;
            }
        }, []),

        onError: useCallback((error: string) => {
            console.log("Stockfish error:", error);
        }, []),
    });

    useEffect(() => {
        // console.log("Starting Stockfish...");
        stockfishLoop();
        setTimeout(() => {
            sendCommandToStockfish("uci");
            sendCommandToStockfish("isready");
            sendCommandToStockfish("ucinewgame");
        }, 1000);


        return () => {
            stopStockfish();
        };
    }, []);

    return (
        <View style={{ width: boardSize, height: boardSize, alignSelf: "center" }}>
            <Text style={styles.text}>Chess Mockup</Text>
            <View style={{ flex: 1, justifyContent: "center", }}>
                <View style={styles.board}>
                    {Array.from({ length: 64 }).map((_, i) => {
                        const squareName = indexToSquare(i);
                        const isSelected = selectedSquare === squareName;
                        // @ts-ignore
                        const chessPiece = getPieceAtSquare(squareName);
                        const isLegalMove = legalMoves.includes(squareName);
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const isDark = (row + col) % 2 === 1;
                        const pieceCode: PieceCode | null = chessPiece
                            ? chessPiece.color === "w"
                                ? chessPiece.type.toUpperCase() as PieceCode
                                : chessPiece.type
                            : null;
                        return (
                            <Pressable
                                key={i}
                                style={[
                                    styles.square,
                                    { backgroundColor: isDark ? "blue" : "green" },
                                    isSelected && { backgroundColor: "yellow" },
                                ]}
                                onPress={() => {
                                    const piece = getPieceAtSquare(squareName);

                                    if (selectedSquare && legalMoves.includes(squareName)) {
                                        movePiece(selectedSquare, squareName);
                                        movePlayer.seekTo(0);
                                        movePlayer.play();
                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        setRefresh((prev) => prev + 1);
                                        setTimeout(() => {
                                            makeAiMove();
                                        }, 300);
                                        return;
                                    }

                                    if (piece && piece.color === "w") {
                                        setSelectedSquare(squareName);
                                        setLegalMoves(getLegalMoves(squareName));
                                        // console.log(piece);
                                    } else {
                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        // console.log(squareName);
                                    }
                                }}
                            >

                                {pieceCode ? <Piece code={pieceCode} size={40} /> : <View style={{ width: 40, height: 40 }} />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    )

}



const styles = StyleSheet.create({
    text: {
        textAlign: "center"
    },
    board: {
        width: "100%",
        aspectRatio: 1,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    square: {
        width: "12.5%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    piece: {
        fontSize: 32,
    },
})


export default Chessboard