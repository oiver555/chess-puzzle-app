import { getLevelName } from "@/util/chessUtils";
import { useStockfish } from "@loloof64/react-native-stockfish";
import { useAudioPlayer } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View, } from "react-native";
import Piece, { PieceCode } from "../components/Piece";
import {
    getCurrentBoard,
    getFen,
    getLegalMoves,
    getPieceAtSquare,
    moveAiPiece,
    movePiece,
    resetGame,
} from "../logic/chessGame";

const moveSound = require("../assets/sounds/move.wav");
const screenWidth = Dimensions.get("window").width;
const boardSize = screenWidth;
const squareSize = boardSize / 8;

const Match = () => {
    const { side, level } = useLocalSearchParams<{
        side?: "white" | "random" | "black";
        level?: string;
    }>();
    const movePlayer = useAudioPlayer(moveSound);
    const [selectedSquare, setSelectedSquare] = React.useState<string | null>(null);
    const [legalMoves, setLegalMoves] = React.useState<string[]>([]);
    const [refresh, setRefresh] = React.useState<number>(0);
    const [showExitModal, setShowExitModal] = React.useState<boolean>(false);
    const indexToSquare = (i: number) => {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const row = Math.floor(i / 8);
        const col = i % 8;
        const rank = 8 - row;
        return `${files[col]}${rank}`;
    };

    const makeAiMove = async () => {
        const fen = getFen();
        sendCommandToStockfish(`position fen ${fen}`);
        sendCommandToStockfish("go movetime 1000 depth 6");
    };

    const waitingForBestMove = React.useRef(false);

    const { stockfishLoop, stopStockfish, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
            const cleanOutput = output.trim();
            if (!cleanOutput) { return }
            console.log(cleanOutput);


            if (cleanOutput === "bestmove") {
                waitingForBestMove.current = true;
                return;
            }

            if (waitingForBestMove.current) {
                console.timeEnd("AI move time");
                const match = cleanOutput.match(/^([a-h][1-8][a-h][1-8][qrbn]?)$/);
                if (match) {
                    const bestMove = match[1];
                    const from = bestMove.slice(0, 2);
                    const to = bestMove.slice(2, 4);
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
        resetGame();
        stockfishLoop();
        sendCommandToStockfish("uci");
        sendCommandToStockfish("isready");
        sendCommandToStockfish("ucinewgame");

        return () => {
            setSelectedSquare(null);
            setLegalMoves([]);
            setRefresh((prev) => prev + 1);
            resetGame()
            sendCommandToStockfish("position startpos");
            stopStockfish();
        };
    }, []);

    function ActionButton({ icon, label, onPress }: { icon: string, label: string, onPress: () => void }) {
        return (
            <Pressable style={styles.actionItem} onPress={onPress}>
                <View style={styles.actionCircle}>
                    <Text style={styles.actionIcon}>{icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
        );
    }

    return (

        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.level}>LEVEL {level}</Text>
                <Text style={styles.rank}>{getLevelName(Number(level))}</Text>
            </View>

            <View style={styles.backRow}>
                <Pressable onPress={() => setShowExitModal(true)}>
                    <Text style={styles.back}>‹</Text>
                </Pressable>
            </View>

            <Modal
                visible={showExitModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Leave match?</Text>

                        <Text style={styles.modalText}>
                            Your current match will be lost if you go back.
                        </Text>

                        <View style={styles.modalActions}>
                            <Pressable onPress={() => setShowExitModal(false)}>
                                <Text>Cancel</Text>
                            </Pressable>

                            <Pressable onPress={() => {              
                                setSelectedSquare(null);
                                setLegalMoves([]);
                                setRefresh((prev) => prev + 1);
                                router.back();
                            }}>
                                <Text>Leave</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.boardWrap}>
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
                                        movePlayer.seekTo(0);
                                        movePlayer.play();
                                        movePiece(selectedSquare, squareName);
                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        setRefresh((prev) => prev + 1);
                                        makeAiMove();
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
                                <Text style={styles.squareLabel}>{squareName}</Text>
                                {pieceCode ? <Piece code={pieceCode} size={40} /> : <View style={{ width: 40, height: 40 }} />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={styles.actions}>
                <ActionButton icon="↻" label="RESTART" onPress={() => {
                    sendCommandToStockfish("ucinewgame");
                    sendCommandToStockfish("position startpos");
                    resetGame()
                    setSelectedSquare(null);
                    setRefresh((prev) => prev + 1)
                }} />
                <ActionButton icon="♜" label="PIECES" onPress={() => sendCommandToStockfish("isready")} />
                <ActionButton icon="↩" label="UNDO" onPress={() => {
                    console.log(JSON.stringify(getCurrentBoard(), null, 2));

                }} />
                <ActionButton icon="💡" label="HINT" onPress={() => {
                    sendCommandToStockfish("d");
                }} />
            </View>

            <View style={styles.adBox}>
                <Text style={styles.adText}>Ad Banner</Text>
            </View>
        </View>


    )

}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#06282d",
    },
    header: {
        height: 120,
        backgroundColor: "#7a330f",
        borderBottomWidth: 4,
        borderBottomColor: "#f5c542",
        justifyContent: "center",
        alignItems: "center",
    },
    level: {
        color: "#f5c542",
        fontSize: 18,
        fontWeight: "900",
    },
    rank: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "900",
        marginTop: 6,
    },
    backRow: {
        height: 70,
        justifyContent: "center",
        paddingLeft: 20,
    },
    back: {
        color: "#f5c542",
        fontSize: 72,
        fontWeight: "900",
    },
    board: {
        width: "100%",
        aspectRatio: 1,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    boardWrap: {
        alignItems: "center",
        justifyContent: "center",
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 32,
        paddingHorizontal: 16,
    },
    actionItem: {
        alignItems: "center",
    },
    actionCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#7a330f",
        borderWidth: 3,
        borderColor: "#f5c542",
        justifyContent: "center",
        alignItems: "center",
    },
    actionIcon: {
        fontSize: 34,
        color: "#f5c542",
    },
    actionLabel: {
        color: "#fff",
        fontWeight: "900",
        marginTop: 8,
        fontSize: 14,
    },
    adBox: {
        height: 70,
        margin: 16,
        backgroundColor: "#e8e8e8",
        justifyContent: "center",
        alignItems: "center",
    },
    adText: {
        color: "#333",
        fontWeight: "700",
    },
    square: {
        width: "12.5%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBox: {
        width: "82%",
        backgroundColor: "#7a330f",
        borderWidth: 4,
        borderColor: "#f5c542",
        borderRadius: 14,
        padding: 20,
    },
    modalTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
    },
    modalText: {
        color: "#f5c542",
        fontSize: 16,
        textAlign: "center",
        marginVertical: 18,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    squareLabel: {
        position: "absolute",
        top: 2,
        left: 3,
        fontSize: 10,
        color: "orange",
        fontWeight: "bold",
        zIndex: 10,
    },
});

export default Match;