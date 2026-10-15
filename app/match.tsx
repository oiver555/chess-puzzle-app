import ActionButton from "@/components/ActionButton";
import AdBanner from "@/components/AdBanner";
import ChessBoard from "@/components/Chessboard";
import PromotionModal from "@/components/PromotionModal";
import { COLORS } from "@/theme/colors";
import { Difficulty, LastMove } from "@/types/match";
import { clearMatchState, loadHints, loadMatchState, loadWins, saveHints, saveMatchState, saveWins } from "@/util/storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Square } from "chess.js";
import { useAudioPlayer } from "expo-audio";
import { router, useLocalSearchParams, } from "expo-router";
import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
    game,
    getFen,
    getPGN,
    getLegalMoves,
    getPieceAtSquare,
    moveAiPiece,
    movePiece,
    resetGame,
    loadPGN,
    loadFEN
} from "../logic/chessGame";
import { SOUNDS } from "../util/sounds";
import RewardModal from "@/components/RewardModal";
import WinModal from "@/components/WinModal";
import { playSound } from "@/util/chessUtils";
import Header from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { useStockfishContext } from "../providers/StockfishProvider";
import EvalBar from "@/components/EvalBar";
import ThinkingDots from "@/components/ThinkingDots";
import { requiredNumOfWins } from "@/constants/globals";
import LooseModal from "@/components/LooseModal";

const Match = () => {
    const { side, difficulty } = useLocalSearchParams<{ side?: "w" | "b" | "r"; difficulty: Difficulty; }>();
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>(difficulty)
    const [lastMove, setLastMove] = React.useState<LastMove>(null);
    const movePlayer = useAudioPlayer(SOUNDS.move);
    const capturePlayer = useAudioPlayer(SOUNDS.capture);
    const checkPlayer = useAudioPlayer(SOUNDS.check);
    const checkmatePlayer = useAudioPlayer(SOUNDS.checkmate);
    const castlePlayer = useAudioPlayer(SOUNDS.castle);
    const drawPlayer = useAudioPlayer(SOUNDS.draw);
    const loosePlayer = useAudioPlayer(SOUNDS.loose);
    const promotionPlayer = useAudioPlayer(SOUNDS.promotion);
    const illegalPlayer = useAudioPlayer(SOUNDS.illegal);
    const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
    const [evalScore, setEvalScore] = React.useState<number>(0);
    const [legalMoves, setLegalMoves] = React.useState<Square[]>([]);
    const [illegalSquare, setIllegalSquare] = React.useState<Square | null>(null);
    const [showExitModal, setShowExitModal] = React.useState<boolean>(false);
    const [isCheckmate, setIsCheckmate] = React.useState<boolean>(false);
    const [squareInCheck, setSquareInCheck] = React.useState<Square | "">("");
    const [playerColor, setPlayerColor] = React.useState<"w" | "b">(() => {
        if (side === "r") {
            return Math.random() < 0.5 ? "w" : "b"
        }
        else if (side === "w") { return "w" }
        else return "b"
    })
    const { sendCommandToStockfish, setOutputHandler, isEngineReady } = useStockfishContext();
    const [matchInitialization, setMatchInitialization] = React.useState<number | null>(null);
    const initialTurnCheckedRef = React.useRef<number | null>(null);
    const isMatchReady = matchInitialization !== null;
    const isOpponentReady = selectedDifficulty === "rookie" || isEngineReady;
    const aiSideRef = React.useRef<"w" | "b">(playerColor === "w" ? "b" : "w");
    const [promotionMove, setPromotionMove] = React.useState<{
        from: Square;
        to: Square;
    } | null>(null);
    const [showWinModal, setShowWinModal] = React.useState(false);
    const [showLooseModal, setShowLooseModal] = React.useState(false);
    const [showClaimModal, setShowClaimModal] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const [, setFen] = React.useState(game.fen());
    const engineRequestRef = React.useRef<"aiMove" | "hint" | null>(null);
    const [hintMove, setHintMove] = React.useState<{ from: Square; to: Square } | null>(null);
    const [hintsLeft, setHintsLeft] = React.useState(3);
    const [isAiThinking, setIsAiThinking] = React.useState(false);
    const [numOfWins, setNumOfWins] = React.useState(0);



    const handlePromotion = (promotion: "q" | "r" | "b" | "n") => {
        if (!promotionMove) return;
        const from = promotionMove.from;
        const to = promotionMove.to;

        if (!from) return;

        playMoveResultSound(promotionMove, "promotion")

        movePiece(promotionMove.from, promotionMove.to, promotion);
        saveMatchState({
            pgn: getPGN(),
            fen: getFen(),
            selectedSquare,
            playerColor,
            aiColor: aiSideRef.current,
            lastMove: {
                from,
                to,
            },
            savedAt: new Date().toISOString(),
            difficulty: selectedDifficulty,
        });
        setLastMove({
            from: promotionMove.from,
            to: promotionMove.to,
        });
        setPromotionMove(null);
        setSelectedSquare(null);
        setLegalMoves([]);
        setFen(game.fen());
        const status = checkGameStatus();

        if (status === "checkmate" || status === "stalemate" || status === "draw") {
            return;
        }

        getAiMove();
    };

    const updateCheckSquare = () => {
        const board = game.board();

        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const piece = board[row][col];

                if (
                    piece &&
                    piece.type === "k" &&
                    piece.color === game.turn()
                ) {
                    const file = "abcdefgh"[col];
                    const rank = 8 - row;

                    setSquareInCheck(`${file}${rank}` as Square);
                    return;
                }
            }
        }

        setSquareInCheck("");
    };

    const getHint = () => {
        if (!isMatchReady || !isEngineReady || game.isGameOver()) return;
        if (hintsLeft <= 0) return;
        if (game.turn() !== playerColor) return;

        engineRequestRef.current = "hint";

        sendCommandToStockfish(`position fen ${getFen()}`);
        sendCommandToStockfish("go depth 1 movetime 1500 ");
        setHintsLeft(prev => prev - 1);
    };

    const getAiMove = async () => {
        if (!isMatchReady || !isOpponentReady) return;
        if (game.isGameOver() || game.turn() !== aiSideRef.current) return;

        setTimeout(() => {
            setIsAiThinking(true);
        }, 200);
        engineRequestRef.current = "aiMove";
        if (selectedDifficulty === "rookie") {

            setTimeout(() => {
                playRookieMove();
            }, 1500);
            return;
        }

        const fen = getFen();
        sendCommandToStockfish(`position fen ${fen}`);
        sendCommandToStockfish("go depth 1 movetime 1500");
    };

    const checkGameStatus = () => {
        if (game.isCheckmate()) {
            updateCheckSquare();
            setIsCheckmate(true);
            return "checkmate";
        }

        if (game.isStalemate()) {
            setSquareInCheck("");
            return "stalemate";
        }

        if (game.isDraw()) {
            setSquareInCheck("");
            return "draw";
        }

        if (game.isCheck()) {
            updateCheckSquare()
            return "check";
        }

        setSquareInCheck("");
        setIsCheckmate(false);

        return "active";
    };

    const undoMove = () => {
        game.undo(); // undo AI move
        game.undo(); // undo player move

        setSelectedSquare(null);
        setLegalMoves([]);
        setIsCheckmate(false);
        setSquareInCheck("");
        setFen(game.fen());
    };

    const playMoveResultSound = (move: any, status: string) => {
        console.log("Status", status);

        if (status === "checkmate") {
            const winner = move?.color === "w" ? "w" : "b";

            if (winner === playerColor) {
                setNumOfWins(prev => {
                    const winCount = prev + 1
                    // IF wins is greater then required wins reset win count and add 3 hints
                    if (winCount > requiredNumOfWins) {
                        saveWins(1)
                        return 1
                    }
                    else {
                        saveWins(winCount)
                        return winCount
                    }
                });

                saveMatchState({
                    fen: getFen(),
                    pgn: getPGN(),
                    selectedSquare,
                    playerColor,
                    aiColor: aiSideRef.current,
                    lastMove: {
                        from: selectedSquare,
                        to: null,
                    },
                    savedAt: new Date().toISOString(),
                    difficulty: selectedDifficulty,
                })

                playSound(movePlayer);
                playSound(checkmatePlayer); // you won
            } else {
                playSound(loosePlayer); // you lost
            }

            return;
        }

        if (status === "draw" || status === "stalemate") {
            console.log(status);
            playSound(drawPlayer);
            return;
        }

        if (status === "check") {
            console.log(status);
            playSound(movePlayer);
            playSound(checkPlayer);
            // return;
        }
        if (status === "promotion") {
            playSound(promotionPlayer)
            return
        }
        if (status === "illegal") {
            playSound(illegalPlayer)
            return
        }

        if (move?.isCapture?.() || move?.enPassant?.()) {
            playSound(capturePlayer);
            return;
        }

        if (move?.isKingsideCastle?.() || move?.isQueensideCastle?.()) {
            playSound(castlePlayer);
            return;
        }

        playSound(movePlayer);
    };



    const playRookieMove = () => {
        const moves = game.moves({ verbose: true });

        if (moves.length === 0) return;

        const randomMove =
            moves[Math.floor(Math.random() * moves.length)];

        setTimeout(() => {
            setTimeout(() => {
                setIsAiThinking(false

                );

            }, 300);

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

            const status = checkGameStatus();

            if (randomMove.promotion) {
                playMoveResultSound(randomMove, "promotion");

            } else {
                playMoveResultSound(randomMove, status);
            }

            saveMatchState({
                fen: getFen(),
                playerColor,
                pgn: getPGN(),
                selectedSquare,
                aiColor: aiSideRef.current,
                lastMove: {
                    from: randomMove.from,
                    to: randomMove.to,
                },
                savedAt: new Date().toISOString(),
                difficulty: selectedDifficulty,
            });

            setLastMove({
                from: randomMove.from,
                to: randomMove.to,
            });

            setFen(game.fen());

        }, 1000);
    };

    const handleSquarePressIn = (squareName: Square) => {
        if (!isMatchReady || !isOpponentReady) return;
        const piece = getPieceAtSquare(squareName);
        const isLegalTarget = !!selectedSquare && legalMoves.includes(squareName);
        const isOwnPiece = piece && piece.color === playerColor;

        if (!isOwnPiece && !isLegalTarget) {
            setIllegalSquare(squareName);

            playMoveResultSound(squareName, "illegal")

            setTimeout(() => {
                setIllegalSquare(null);
            }, 150);
        }

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

            movePiece(selectedSquare, squareName);
            saveMatchState({
                fen: getFen(),
                pgn: getPGN(),
                selectedSquare,
                playerColor,
                aiColor: aiSideRef.current,
                lastMove: {
                    from: selectedSquare,
                    to: squareName,
                },
                savedAt: new Date().toISOString(),
                difficulty: selectedDifficulty,
            });
            setLastMove({
                from: selectedSquare,
                to: squareName,
            });
            setSelectedSquare(null);
            setLegalMoves([]);
            setFen(game.fen());
            setHintMove(null);

            const status = checkGameStatus();
            playMoveResultSound(selectedMove, status);

            getAiMove();
            return;

        }

        if (piece && piece.color === playerColor) {
            playSound(capturePlayer);
            setSelectedSquare(squareName);
            setLegalMoves(getLegalMoves(squareName));
        }
    };

    const multiPvMovesRef = React.useRef<Map<number, string>>(new Map());
    const parseMultiPvLine = (line: string) => {
        const match = line.match(
            /multipv\s+(\d+).*?\spv\s+([a-h][1-8][a-h][1-8][qrbn]?)/
        );

        if (!match) return;



        const multiPvNumber = Number(match[1]);
        const move = match[2];

        multiPvMovesRef.current.set(multiPvNumber, move);
    };

    // Refresh the handler after each render so restored colors and difficulty are used.
    useEffect(() => {
        setOutputHandler((output: string) => {
            const cleanOutput = output.trim();
            if (!cleanOutput) return;

            // console.log(cleanOutput);

            if (cleanOutput.includes(" multipv ") && cleanOutput.includes(" pv ")) {
                parseMultiPvLine(cleanOutput);
                return;
            }

            const cpMatch = cleanOutput.match(/score cp (-?\d+)/);

            if (cpMatch) {
                const centipawns = Number(cpMatch[1]);
                setEvalScore(centipawns / 100);
            }

            if (cleanOutput.startsWith("bestmove")) {
                // your current bestmove logic here

                const selectedMove = multiPvMovesRef.current.get(1)

                if (!selectedMove) {
                    multiPvMovesRef.current.clear();
                    engineRequestRef.current = null;
                    return;
                }

                const from = selectedMove.slice(0, 2) as Square;
                const to = selectedMove.slice(2, 4) as Square;
                const promotion = selectedMove.slice(4, 5) as "q" | "r" | "b" | "n" | "";

                // console.log(engineRequestRef.current);
                if (engineRequestRef.current === "hint") {

                    setHintMove({ from, to });

                    multiPvMovesRef.current.clear();
                    engineRequestRef.current = null;
                    return;
                }

                if (engineRequestRef.current === "aiMove") {
                    setTimeout(() => {
                        setIsAiThinking(false);

                    }, 300);

                    const aiMove = moveAiPiece(from, to, promotion || undefined);
                    const status = checkGameStatus();

                    playMoveResultSound(aiMove, status);

                    if (!aiMove) return;

                    setLastMove({ from, to });
                    setFen(game.fen());

                    if (status === "checkmate") {
                        const winner = game.turn() === "w" ? "b" : "w";

                        if (winner === playerColor) {
                            console.log("You Win!");

                        } else {
                            console.log("You Lost!");

                            setTimeout(() => {
                                setShowLooseModal(true)

                            }, 1000)
                        }


                        engineRequestRef.current = null;
                        return;
                    }

                    if (status === "stalemate") {
                        // Handle stalemate
                        engineRequestRef.current = null;
                        return;
                    }

                    if (status === "draw") {
                        // Handle draw
                        engineRequestRef.current = null;
                        return;
                    }


                    saveMatchState({
                        fen: getFen(),
                        pgn: getPGN(),
                        playerColor,
                        selectedSquare,
                        aiColor: aiSideRef.current,
                        lastMove: {
                            from,
                            to,
                        },
                        savedAt: new Date().toISOString(),
                        difficulty: selectedDifficulty,
                    });

                    multiPvMovesRef.current.clear();
                    engineRequestRef.current = null;
                }
            }
        });

        return () => {
            setOutputHandler(null);
        };
    });

    useEffect(() => {
        let cancelled = false;

        const claimTimer = setTimeout(() => {
            setShowClaimModal(true);
        }, 1000);

        loadMatchState().then((savedState) => {
            if (cancelled) return;
            if (savedState) {
                // console.log(JSON.stringify(savedState, null, 2));
                loadFEN(savedState.fen);
                loadPGN(savedState.pgn);
                setPlayerColor(savedState.playerColor);
                setLastMove(savedState.lastMove ?? null);
                aiSideRef.current = savedState.aiColor;
                setSelectedDifficulty(savedState.difficulty);
                setSelectedSquare(savedState.selectedSquare)
                console.log(game.isCheckmate())

            } else {
                resetGame();
                saveMatchState({
                    fen: getFen(),
                    playerColor,
                    pgn: getPGN(),
                    selectedSquare,
                    aiColor: aiSideRef.current,
                    lastMove: {
                        from: null,
                        to: null,
                    },
                    savedAt: new Date().toISOString(),
                    difficulty: selectedDifficulty,
                });

                console.log("No Saved Data");

            }
            setFen(game.fen());
            setMatchInitialization(0);


            if (game.isCheckmate()) {
                const winner = game.turn() === 'w' ? 'b' : 'w';

                if (winner === playerColor) {
                    setShowWinModal(true)

                }
            }
        }).catch((error) => {
            console.log("Could not initialize match:", error);
        });


        loadWins().then(wins => {
            if (wins) setNumOfWins(wins)
        })

        loadHints().then(hints => {
            if (hints) setHintsLeft(hints)
        })






        return () => {
            cancelled = true;
            clearTimeout(claimTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Check once per initialization/restart, after the position and opponent are ready.
    useEffect(() => {
        if (!isMatchReady || !isOpponentReady || initialTurnCheckedRef.current === matchInitialization) return;

        initialTurnCheckedRef.current = matchInitialization;
        getAiMove();
    });

    useEffect(() => {
        const subscription = checkmatePlayer.addListener(
            "playbackStatusUpdate",
            (status) => {
                if (status.didJustFinish && game.isCheckmate() && game.turn() !== playerColor) {
                    setShowWinModal(true);

                    if (numOfWins === requiredNumOfWins) {
                        setHintsLeft(prev => {

                            const newHintCount = prev + 3

                            saveHints(newHintCount)

                            return newHintCount

                        })
                    }

                } else {

                }
            }
        );

        return () => {
            subscription.remove();
        };
    }, [numOfWins]);




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
                                    setFen(game.fen());

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

            <WinModal visible={showWinModal}
                wins={numOfWins}
                requiredWins={requiredNumOfWins}
                setHintsLeft={setHintsLeft}
                onNewGame={() => {

                    clearMatchState();
                    sendCommandToStockfish("stop");
                    sendCommandToStockfish("ucinewgame");
                    sendCommandToStockfish("position startpos");

                    resetGame();

                    setSelectedSquare(null);
                    setLegalMoves([]);
                    setLastMove(null);
                    setIllegalSquare(null);
                    setSquareInCheck("");
                    setIsCheckmate(false);
                    setPromotionMove(null);

                    setFen(game.fen());

                    setTimeout(() => {
                        router.replace("ComputerSettings");
                    }, 100)
                }}
                onGameView={() => {
                    // setShowWinModal(false);
                }}
                onClose={() => setShowWinModal(false)}
            />

            <LooseModal
                visible={showLooseModal}
                onNewGame={() => {

                    clearMatchState();
                    sendCommandToStockfish("stop");
                    sendCommandToStockfish("ucinewgame");
                    sendCommandToStockfish("position startpos");

                    resetGame();

                    setSelectedSquare(null);
                    setLegalMoves([]);
                    setLastMove(null);
                    setIllegalSquare(null);
                    setSquareInCheck("");
                    setIsCheckmate(false);
                    setPromotionMove(null);

                    setFen(game.fen());

                    setTimeout(() => {
                        router.replace("ComputerSettings");
                    }, 100)
                }}
                onGameView={() => {
                    // setShowWinModal(false);
                }}
            />
            {/* <ClaimHintModal visible={showClaimModal} amount={2}
                onClaim={() => {
                    setHintsLeft(hintsLeft + 2);
                    setShowClaimModal(false);
                }}
                onDismiss={() => setShowClaimModal(false)} /> */}
            <RewardModal visible={false} onClose={() => { }} />
            <PromotionModal visible={promotionMove !== null} playerColor={playerColor} onPromote={handlePromotion} />
            <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
            <Header
                onBack={() => {
                    game.reset();
                    setFen(game.fen());
                    setLastMove(null);
                    setSelectedSquare(null);
                    setLegalMoves([]);
                    playSound(illegalPlayer)
                    clearMatchState()
                    sendCommandToStockfish("stop");
                    // stopStockfish()
                    router.push("ComputerSettings");


                }}
                title={selectedDifficulty}
                variant={2}
                onSettings={() => setShowSettings(true)}
            />

            <View style={styles.content}>
                <View>
                    <ThinkingDots visible={isAiThinking} />

                </View>
                <View style={styles.boardWrap}>
                    {false && <EvalBar score={evalScore} />}
                    <View style={styles.board}>
                        <ChessBoard
                            selectedSquare={selectedSquare}
                            legalMoves={legalMoves}
                            playerColor={playerColor}
                            isCheckmate={isCheckmate}
                            squareInCheck={squareInCheck}
                            getPieceAtSquare={getPieceAtSquare}
                            onSquarePressIn={handleSquarePressIn}
                            lastMove={lastMove}
                            illegalSquare={illegalSquare}
                            hintMove={hintMove}
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
                        label="RESTART"
                        onPress={() => {
                            if (!isMatchReady) return;
                            playSound(capturePlayer);
                            clearMatchState();
                            sendCommandToStockfish("stop");
                            sendCommandToStockfish("ucinewgame");
                            sendCommandToStockfish("position startpos");
                            resetGame();
                            setSelectedSquare(null);
                            setLegalMoves([]);
                            setLastMove(null);
                            setIllegalSquare(null);
                            setSquareInCheck("");
                            setIsCheckmate(false);
                            setPromotionMove(null);

                            setFen(game.fen());
                            setMatchInitialization(previous => (previous ?? 0) + 1);
                        }} />
                    <ActionButton
                        icon={
                            <MaterialCommunityIcons
                                name="chess-rook"
                                size={34}
                                color={COLORS.board.border}
                            />
                        }
                        label="PIECES" onPress={() => playSound(capturePlayer)} />
                    <ActionButton
                        icon={
                            <Ionicons
                                name="arrow-undo"
                                size={34}
                                color={COLORS.board.border}

                            />
                        }
                        label="UNDO" onPress={() => {
                            playSound(capturePlayer);
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
                        badgeCount={hintsLeft}

                        label="HINT"
                        onPress={() => {
                            playSound(capturePlayer);
                            getHint();
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
