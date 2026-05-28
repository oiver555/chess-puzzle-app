import ActionButton from "@/components/ActionButton";
import AdBanner from "@/components/AdBanner";
import ChessBoard from "@/components/Chessboard";
import PromotionModal from "@/components/PromotionModal";
import { COLORS } from "@/theme/colors";
import { LastMove } from "@/types/match";
import { clearMatchState, loadMatchState, saveAppState, saveMatchState } from "@/util/storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useStockfish } from "@loloof64/react-native-stockfish";
import { Square } from "chess.js";
import { useAudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, usePathname } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
    game,
    getFen,
    getLegalMoves,
    getPieceAtSquare,
    moveAiPiece,
    movePiece,
    resetGame
} from "../logic/chessGame";

const moveSound = require("../assets/sounds/move.wav");
const TEST_FEN = "8/P7/8/8/8/8/8/4k2K w - - 0 1";

const Match = () => {
    const { side, difficulty } = useLocalSearchParams<{ side?: "w" | "b" | "r"; difficulty?: string; }>();
    const [lastMove, setLastMove] = React.useState<LastMove>(null);
    const movePlayer = useAudioPlayer(moveSound);
    const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
    const [evalScore, setEvalScore] = React.useState<number>(0);
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

    const handlePromotion = (promotion: "q" | "r" | "b" | "n") => {
        if (!promotionMove) return;
        const from = promotionMove.from;
        const to = promotionMove.to;

        if (!from) return;

        playMoveSound();

        movePiece(promotionMove.from, promotionMove.to, promotion);
        saveMatchState({
            fen: getFen(),
            playerColor: playerColorRef.current,
            aiColor: aiSideRef.current,
            lastMove: {
                from,
                to,
            },
            savedAt: new Date().toISOString(),
        });
        setLastMove({
            from: promotionMove.from,
            to: promotionMove.to,
        });
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
        if (difficulty === "rookie") {
            playRookieMove();
            return;
        }

        const fen = getFen();
        sendCommandToStockfish(`position fen ${fen}`);
        sendCommandToStockfish("go movetime 1000 depth 1");
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
    console.log(movePlayer.isLoaded);
    console.log(movePlayer.isBuffering);

    const playMoveSound = () => {
        console.log("Playsound");

        movePlayer.seekTo(0);
        setTimeout(() => {
            movePlayer.play();
        }, 100);
    }

    const waitingForBestMove = React.useRef(false);

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
            const cleanOutput = output.trim();
            if (!cleanOutput) { return }
            // console.log(cleanOutput);

            const cpMatch = cleanOutput.match(/score cp (-?\d+)/);

            if (cpMatch) {
                const centipawns = Number(cpMatch[1]);
                const score = centipawns / 100;
                console.log("Centipawns: ", score);
                setEvalScore(score);
            }

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
                    saveMatchState({
                        fen: getFen(),
                        playerColor: playerColorRef.current,
                        aiColor: aiSideRef.current,
                        lastMove: {
                            from,
                            to,
                        },
                        savedAt: new Date().toISOString(),
                    });
                    setLastMove({
                        from,
                        to,
                    });
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

    const handleSquarePress = (squareName: Square) => {
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

            playMoveSound();
            movePiece(selectedSquare, squareName);
            saveMatchState({
                fen: getFen(),
                playerColor: playerColorRef.current,
                aiColor: aiSideRef.current,
                lastMove: {
                    from: selectedSquare,
                    to: squareName,
                },
                savedAt: new Date().toISOString(),
            });
            setLastMove({
                from: selectedSquare,
                to: squareName,
            });
            setSelectedSquare(null);
            setLegalMoves([]);
            setRefresh((prev) => prev + 1);

            const status = checkGameStatus();

            if (
                status === "checkmate" ||
                status === "stalemate" ||
                status === "draw"
            ) {
                return;
            }

            getAiMove();
            return;
        }

        if (piece && piece.color === playerColorRef.current) {
            setSelectedSquare(squareName);
            setLegalMoves(getLegalMoves(squareName));
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const playRookieMove = () => {
        const moves = game.moves({ verbose: true });

        if (moves.length === 0) return;

        const randomMove =
            moves[Math.floor(Math.random() * moves.length)];

        setTimeout(() => {
            playMoveSound();

            moveAiPiece(
                randomMove.from,
                randomMove.to,
                randomMove.promotion as
                | "q"
                | "r"
                | "b"
                | "n"
                | undefined
            );

            saveMatchState({
                fen: getFen(),
                playerColor: playerColorRef.current,
                aiColor: aiSideRef.current,
                lastMove: {
                    from: randomMove.from,
                    to: randomMove.to,
                },
                savedAt: new Date().toISOString(),
            });

            setLastMove({
                from: randomMove.from,
                to: randomMove.to,
            });

            setRefresh((prev) => prev + 1);

        }, 1000);
    };

    const pathname = usePathname()
    useEffect(() => {
        stockfishLoop();
        sendCommandToStockfish("uci");
        sendCommandToStockfish("setoption name UCI_LimitStrength value true");
        sendCommandToStockfish("setoption name UCI_Elo value 400");
        sendCommandToStockfish("isready");
        sendCommandToStockfish("ucinewgame");
        // game.load(TEST_FEN);
        setRefresh((prev) => prev + 1)
        movePlayer.seekTo(0);
        return () => {
            setSelectedSquare(null);
            setLegalMoves([]);
            sendCommandToStockfish("stop");
            resetGame();
        };
    }, []);

    useEffect(() => {
        saveAppState({
            lastRoute: pathname,
            savedAt: new Date().toISOString(),
        });

        async function restoreMatch() {

            const saved = await loadMatchState();

            if (!saved) {
                if (playerColorRef.current === "b") {
                    getAiMove();
                }
                return;
            }

            game.load(saved.fen);

            setRefresh(prev => prev + 1)

            if (saved.lastMove) {
                setLastMove(saved.lastMove);
            }

            if (game.turn() === aiSideRef.current) {
                getAiMove();
            }

        }

        restoreMatch();
    }, []);

    return (

        <View style={styles.screen}>
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
                            <Pressable
                                onPress={() => setShowExitModal(false)}
                                style={[styles.modalButton, styles.cancelButton]}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    clearMatchState();
                                    resetGame();

                                    setSelectedSquare(null);
                                    setLegalMoves([]);
                                    setLastMove(null);
                                    setRefresh((prev) => prev + 1);

                                    sendCommandToStockfish("stop");
                                    sendCommandToStockfish("ucinewgame");

                                    setTimeout(() => {
                                        router.replace("ComputerSettings");
                                    }, 100)
                                }}

                                style={[styles.modalButton, styles.leaveButton]}
                            >
                                <Text style={styles.leaveButtonText}>Leave</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <PromotionModal visible={promotionMove !== null} playerColor={playerColorRef.current} onPromote={handlePromotion} />
            <LinearGradient colors={[COLORS.header.dark, COLORS.header.dark2]} style={styles.header}>
                <Text style={styles.level}>LEVEL</Text>
                <Text style={styles.rank}>{difficulty}</Text>
            </LinearGradient>

            <View style={styles.backRow}>
                <Pressable
                    onPress={() => setShowExitModal(true)}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </Pressable>
            </View>
            <View style={styles.settingsRow}>
                <Pressable
                    onPress={() => {
                        // open settings
                    }}
                    style={styles.settingsButton}
                >
                    <Ionicons
                        name="settings-sharp"
                        size={24}
                        color="#fff"
                    />
                </Pressable>
            </View>
            <View style={styles.content}>
                <View style={styles.boardWrap}>
                    {/* <EvalBar score={evalScore} /> */}
                    <View style={styles.board}>
                        <ChessBoard
                            selectedSquare={selectedSquare}
                            legalMoves={legalMoves}
                            playerColor={playerColorRef.current}
                            isCheckmate={isCheckmate}
                            squareInCheck={squareInCheck}
                            getPieceAtSquare={getPieceAtSquare}
                            onSquarePress={handleSquarePress}
                            lastMove={lastMove}
                        />
                    </View>
                </View>

                <View style={styles.actions}>
                    <ActionButton
                        icon={
                            <Ionicons
                                name="refresh"
                                size={34}
                                color={COLORS.board.border}

                            />
                        }
                        label="RESTART" onPress={() => {
                            clearMatchState();
                            sendCommandToStockfish("ucinewgame");
                            sendCommandToStockfish("position startpos");
                            resetGame()
                            setSelectedSquare(null);
                            setRefresh((prev) => prev + 1)
                        }} />
                    <ActionButton
                        icon={
                            <MaterialCommunityIcons
                                name="chess-rook"
                                size={34}
                                color={COLORS.board.border}
                            />
                        }
                        label="PIECES" onPress={() => sendCommandToStockfish("isready")} />
                    <ActionButton
                        icon={
                            <Ionicons
                                name="arrow-undo"
                                size={34}
                                color={COLORS.board.border}

                            />
                        }
                        label="UNDO" onPress={() => {
                            undoMove();

                        }} />
                    <ActionButton
                        icon={
                            <Ionicons
                                name="bulb"
                                size={34}
                                color={COLORS.board.border}
                            />
                        }
                        label="HINT" onPress={() => {
                            sendCommandToStockfish("d");
                        }} />
                </View>

            </View>
            <View style={{ width: "100%" }}>
                <AdBanner />
            </View>
        </View>


    )

}

const styles = StyleSheet.create({
    settingsRow: {
        position: "absolute",
        top: 55,
        right: 24,
        zIndex: 10,
    },

    settingsButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.68)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    modalBox: {
        width: "100%",
        backgroundColor: COLORS.background,
        borderWidth: 2,
        borderColor: COLORS.board.border,
        borderRadius: 24,
        padding: 24,
    },

    modalTitle: {
        color: COLORS.text.primary,
        fontSize: 26,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 0.5,
    },

    modalText: {
        color: COLORS.text.muted,
        fontSize: 16,
        textAlign: "center",
        lineHeight: 23,
        marginTop: 14,
        marginBottom: 24,
    },

    modalActions: {
        flexDirection: "row",
        gap: 12,
    },

    modalButton: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },

    cancelButton: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },

    leaveButton: {
        backgroundColor: COLORS.board.border,
    },

    cancelButtonText: {
        color: COLORS.text.primary,
        fontSize: 15,
        fontWeight: "800",
    },

    leaveButtonText: {
        color: COLORS.background,
        fontSize: 15,
        fontWeight: "900",
    },
    content: {
        flex: 1,
        justifyContent: "space-evenly",
    },
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
        backgroundColor: COLORS.background
    },
    header: {
        height: 150,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 3,
        borderBottomColor: COLORS.board.border,
        backgroundColor: COLORS.background,
    },
    level: {
        color: COLORS.text.muted,
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 1,
        marginBottom: 10,
    },
    rank: {
        color: COLORS.text.primary,
        fontSize: 34,
        fontWeight: "900",
        marginTop: 6,
        letterSpacing: 1,
    },
    backRow: {
        position: "absolute",
        top: 55,
        left: 24,
        zIndex: 10,
    },

    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
    },

    back: {
        color: COLORS.text.primary,
        fontSize: 54,
        fontWeight: "700",
        marginTop: -6,
    },
    board: {
        width: "100%",
        aspectRatio: 1,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    boardWrap: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingHorizontal: 10,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-around",
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

    squareLabel: {
        position: "absolute",
        top: 2,
        left: 3,
        fontSize: 10,
        color: "orange",
        fontWeight: "bold",
        zIndex: 10,
        opacity: 0.55,
    },
});

export default Match;
