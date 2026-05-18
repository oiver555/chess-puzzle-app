import { getLevelName } from "@/util/chessUtils";
import { useStockfish } from "@loloof64/react-native-stockfish";
import { useAudioPlayer } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View, } from "react-native";
import Piece, { PieceCode } from "../components/Piece";
import {
    game,
    getCurrentBoard,
    getFen,
    getLegalMoves,
    getPieceAtSquare,
    moveAiPiece,
    movePiece,
    resetGame,

} from "../logic/chessGame";
import { Square, } from "chess.js";

const moveSound = require("../assets/sounds/move.wav");
const screenWidth = Dimensions.get("window").width;
const boardSize = screenWidth;
const squareSize = boardSize / 8;
const TEST_FEN = "8/P7/8/8/8/8/8/4k2K w - - 0 1";
const Match = () => {
    const { side, level } = useLocalSearchParams<{
        side?: "w" | "b" | "r";
        level?: string;
    }>();

    const movePlayer = useAudioPlayer(moveSound);
    const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
    const [legalMoves, setLegalMoves] = React.useState<Square[]>([]);
    const [refresh, setRefresh] = React.useState<number>(0);
    const [showExitModal, setShowExitModal] = React.useState<boolean>(false);
    const [isCheckmate, setIsCheckmate] = React.useState<boolean>(false);
    const [squareInCheck, setSquareInCheck] = React.useState<Square | "">("");
    const playerColorRef = React.useRef<"w" | "b">(side === "r" ? (Math.random() < 0.5 ? "w" : "b") : (side === "w" ? "w" : "b"));
    const aiSideRef = React.useRef<"w" | "b">(playerColorRef.current === "w" ? "b" : "w");
    const [promotionMove, setPromotionMove] = React.useState<{
        from: Square;
        to: Square;
    } | null>(null);
    const indexToSquare = (i: number): Square => {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
        const row = Math.floor(i / 8);
        const col = i % 8;

        if (playerColorRef.current === "w") {
            const rank = 8 - row;
            return `${files[col]}${rank}` as Square;
        } else {
            const flippedFiles = [...files].reverse();
            const rank = row + 1;
            return `${flippedFiles[col]}${rank}` as Square;
        }
    };

    const handlePromotion = (promotion: "q" | "r" | "b" | "n") => {
        if (!promotionMove) return;

        playMoveSound();

        movePiece(promotionMove.from, promotionMove.to, promotion);

        setPromotionMove(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        setRefresh((prev) => prev + 1);

        const status = checkGameStatus();

        if (status === "checkmate" || status === "stalemate" || status === "draw") {
            console.log(status);
            return;
        }

        getAiMove();
    };

    const getAiMove = async () => {
        const fen = getFen();
        sendCommandToStockfish(`position fen ${fen}`);
        sendCommandToStockfish("go movetime 1000 depth 6");
    };

    const checkGameStatus = () => {
        if (game.isCheckmate()) {
            return "checkmate";
        }

        if (game.isStalemate()) {
            return "stalemate";
        }

        if (game.isDraw()) {
            return "draw";
        }

        if (game.isCheck()) {
            return "check";
        }

        return "active";
    };

    const undoMove = () => {
        game.undo(); // undo AI move
        game.undo(); // undo player move

        setSelectedSquare(null);
        setLegalMoves([]);
        setIsCheckmate(false);
        setSquareInCheck("");
        setRefresh((prev) => prev + 1);
    };

    const playMoveSound = () => {
        // movePlayer.seekTo(0);
        // movePlayer.play();
    }


    const waitingForBestMove = React.useRef(false);

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
            const cleanOutput = output.trim();
            if (!cleanOutput) { return }
            // console.log(cleanOutput);


            if (cleanOutput === "bestmove") {
                waitingForBestMove.current = true;
                return;
            }

            if (waitingForBestMove.current) {
                const match = cleanOutput.match(/^([a-h][1-8][a-h][1-8][qrbn]?)$/);
                if (match) {
                    const bestMove = match[1];
                    const from = bestMove.slice(0, 2) as Square;
                    const to = bestMove.slice(2, 4) as Square;
                    const promotion = bestMove.slice(4, 5) as "q" | "r" | "b" | "n" | "";
                    playMoveSound()
                    moveAiPiece(from, to, promotion || undefined);
                    const status = checkGameStatus();
                    if (status === "check") {

                    }
                    console.log("Match.tsx", status);
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
        stockfishLoop();
        sendCommandToStockfish("uci");
        sendCommandToStockfish("isready");
        sendCommandToStockfish("ucinewgame");
        sendCommandToStockfish(`position fen ${TEST_FEN}`);
        setRefresh((prev) => prev + 1)
        if (playerColorRef.current === "b") {
            getAiMove();
        }

        return () => {
            setSelectedSquare(null);
            setLegalMoves([]);
            setRefresh((prev) => prev + 1);
            resetGame()
            sendCommandToStockfish("stop");
            sendCommandToStockfish("ucinewgame");
            sendCommandToStockfish("position startpos");
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
            <Modal
                visible={promotionMove !== null}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Promote Pawn</Text>

                        <View style={styles.promotionRow}>
                            {(["q", "r", "b", "n"] as const).map((piece) => (
                                <Pressable
                                    key={piece}
                                    style={styles.promotionButton}
                                    onPress={() => handlePromotion(piece)}
                                >

                                    <Piece
                                        code={
                                            playerColorRef.current === "w"
                                                ? piece.toUpperCase() as PieceCode
                                                : piece as PieceCode
                                        }
                                        size={42}
                                    />

                                </Pressable>
                            ))}
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
                        // console.log(chessPiece);
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
                                    { backgroundColor: isCheckmate && squareInCheck === squareName ? "red" : isDark ? "blue" : "green" },
                                    isSelected && { backgroundColor: "yellow" },
                                ]}
                                onPress={() => {
                                    const piece = getPieceAtSquare(squareName);

                                    if (selectedSquare && legalMoves.includes(squareName)) {


                                        const moves = game.moves({
                                            square: selectedSquare,
                                            verbose: true,
                                        });

                                        const selectedMove = moves.find((move) => move.to === squareName);

                                        if (selectedMove?.isPromotion()) {
                                            setPromotionMove({
                                                from: selectedSquare,
                                                to: squareName,
                                            });
                                            return;
                                        }
                                        playMoveSound()
                                        movePiece(selectedSquare, squareName);
                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        setRefresh((prev) => prev + 1);

                                        const status = checkGameStatus();


                                        if (status === "checkmate" || status === "stalemate" || status === "draw") {
                                            return;
                                        }
                                        if (status === "check") {
                                            console.log("check");
                                        }

                                        getAiMove();
                                        return;
                                    }

                                    if (piece && piece.color === playerColorRef.current) {
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
                                {isLegalMove && <View style={styles.legalMoveDot} />}
                               
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
                    undoMove();

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
    captureRing: {
        position: "absolute",
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 4,
        borderColor: "rgba(0, 200, 0, 0.75)",
        alignSelf: "center",
        top: "50%",
        marginTop: -26,
    },
    legalMoveDot: {
        position: "absolute",
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "rgba(0, 180, 0, 0.65)",
        alignSelf: "center",
        top: "50%",
        marginTop: -11,
    },
    promotionRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20,
    },

    promotionButton: {
        width: 54,
        height: 54,
        borderRadius: 10,
        backgroundColor: "#f5c542",
        justifyContent: "center",
        alignItems: "center",
    },

    promotionText: {
        color: "#7a330f",
        fontSize: 28,
        fontWeight: "900",
    },
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
        transform: [{ rotateZ: 0 + "deg" }],
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
