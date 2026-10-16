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
import { router, useFocusEffect, useIsFocused, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
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

type PendingAction = {
    kind: "aiMove" | "hint";
    version: number;
    fen: string;
};

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
    const { requestSearch, cancelSearch, isEngineReady, engineError } = useStockfishContext();
    const isFocused = useIsFocused();
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
    const actionRef = React.useRef<PendingAction | null>(null);
    const ownerRef = React.useRef(Symbol("match"));
    const activeRef = React.useRef(false);
    const versionRef = React.useRef(0);
    const timersRef = React.useRef(new Set<ReturnType<typeof setTimeout>>());
    const initializedRef = React.useRef(false);
    const multiPvMovesRef = React.useRef<Map<number, string>>(new Map());
    const winResultRef = React.useRef<{ version: number; fen: string } | null>(null);
    const [hintMove, setHintMove] = React.useState<{ from: Square; to: Square } | null>(null);
    const displayedHintFenRef = React.useRef<string | null>(null);
    const [hintsLeft, setHintsLeft] = React.useState(3);
    const [isAiThinking, setIsAiThinking] = React.useState(false);
    const [numOfWins, setNumOfWins] = React.useState(0);

    const scheduleTask = React.useCallback((callback: () => void, delay: number, fen?: string) => {
        const version = versionRef.current;
        const timer = setTimeout(() => {
            timersRef.current.delete(timer);
            if (!activeRef.current || versionRef.current !== version) return;
            if (fen !== undefined && getFen() !== fen) return;
            callback();
        }, delay);
        timersRef.current.add(timer);
        return timer;
    }, []);

    const cancelPendingWork = React.useCallback((newGame = false) => {
        versionRef.current += 1;
        timersRef.current.forEach(clearTimeout);
        timersRef.current.clear();
        actionRef.current = null;
        multiPvMovesRef.current.clear();
        winResultRef.current = null;
        cancelSearch(ownerRef.current, newGame);
        try {
            checkmatePlayer.pause();
        } catch (error) {
            console.log("Could not pause result audio:", error);
        }
        setIsAiThinking(false);
        displayedHintFenRef.current = null;
        setHintMove(null);
        setIllegalSquare(null);
        setPromotionMove(null);
        setShowWinModal(false);
        setShowLooseModal(false);
        setShowClaimModal(false);
    }, [cancelSearch, checkmatePlayer]);

    const isCurrentAction = (action: PendingAction) =>
        activeRef.current && actionRef.current === action &&
        versionRef.current === action.version && getFen() === action.fen;

    const startEngineAction = (action: PendingAction) => {
        multiPvMovesRef.current.clear();
        requestSearch({
            owner: ownerRef.current,
            fen: action.fen,
            onOutput: output => {
                if (isCurrentAction(action)) handleEngineOutput(output, action);
            },
            onError: message => {
                if (!isCurrentAction(action)) return;
                cancelPendingWork();
                if (selectedDifficulty === "rookie") Alert.alert("Computer unavailable", message);
            },
        });
    };



    const handlePromotion = (promotion: "q" | "r" | "b" | "n") => {
        if (!activeRef.current || !promotionMove) return;
        const from = promotionMove.from;
        const to = promotionMove.to;

        if (!from) return;

        cancelPendingWork();
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
        if (!activeRef.current || !isMatchReady || !isEngineReady || game.isGameOver()) return;
        if (hintsLeft <= 0 || game.turn() !== playerColor) return;
        if (displayedHintFenRef.current === getFen()) return;
        const current = actionRef.current;
        if (current && isCurrentAction(current)) return;

        const action: PendingAction = { kind: "hint", version: versionRef.current, fen: getFen() };
        actionRef.current = action;
        startEngineAction(action);
    };

    const getAiMove = () => {
        if (!activeRef.current || !isMatchReady || !isOpponentReady) return;
        if (game.isGameOver() || game.turn() !== aiSideRef.current) return;
        const current = actionRef.current;
        if (current?.kind === "aiMove" && isCurrentAction(current)) return;

        const action: PendingAction = { kind: "aiMove", version: versionRef.current, fen: getFen() };
        actionRef.current = action;
        scheduleTask(() => setIsAiThinking(true), 200, action.fen);
        if (selectedDifficulty === "rookie") {
            scheduleTask(() => {
                if (isCurrentAction(action)) playRookieMove(action);
            }, 1500, action.fen);
        } else {
            startEngineAction(action);
        }
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
        if (!activeRef.current || !isMatchReady) return;
        cancelPendingWork();
        game.undo(); // undo AI move
        game.undo(); // undo player move

        setSelectedSquare(null);
        setLegalMoves([]);
        setIsCheckmate(false);
        setSquareInCheck("");
        setFen(game.fen());
        setMatchInitialization(previous => (previous ?? 0) + 1);
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
                winResultRef.current = { version: versionRef.current, fen: getFen() };
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



    const playRookieMove = (action: PendingAction) => {
        if (!isCurrentAction(action) || game.isGameOver() || game.turn() !== aiSideRef.current) return;
        const moves = game.moves({ verbose: true });

        if (moves.length === 0) return;

        const randomMove =
            moves[Math.floor(Math.random() * moves.length)];

        scheduleTask(() => {
            if (!isCurrentAction(action) || game.isGameOver() || game.turn() !== aiSideRef.current) return;
            actionRef.current = null;
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
            scheduleTask(() => setIsAiThinking(false), 300, getFen());

        }, 1000, action.fen);
    };

    const handleSquarePressIn = (squareName: Square) => {
        if (!activeRef.current || !isMatchReady || !isOpponentReady) return;
        const piece = getPieceAtSquare(squareName);
        const isLegalTarget = !!selectedSquare && legalMoves.includes(squareName);
        const isOwnPiece = piece && piece.color === playerColor;

        if (!isOwnPiece && !isLegalTarget) {
            setIllegalSquare(squareName);

            playMoveResultSound(squareName, "illegal")

            scheduleTask(() => {
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

            cancelPendingWork();
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

    const parseMultiPvLine = (line: string) => {
        const match = line.match(
            /multipv\s+(\d+).*?\spv\s+([a-h][1-8][a-h][1-8][qrbn]?)/
        );

        if (!match) return;



        const multiPvNumber = Number(match[1]);
        const move = match[2];

        multiPvMovesRef.current.set(multiPvNumber, move);
    };

    const handleEngineOutput = (output: string, action: PendingAction) => {
        const cleanOutput = output.trim();
        if (!isCurrentAction(action) || game.isGameOver()) return;

        if (cleanOutput.includes(" multipv ") && cleanOutput.includes(" pv ")) {
            parseMultiPvLine(cleanOutput);
            return;
        }
        const cpMatch = cleanOutput.match(/score cp (-?\d+)/);
        if (cpMatch) setEvalScore(Number(cpMatch[1]) / 100);
        if (!cleanOutput.startsWith("bestmove")) return;

        const selectedMove = multiPvMovesRef.current.get(1);
        multiPvMovesRef.current.clear();
        actionRef.current = null;
        if (!selectedMove) {
            setIsAiThinking(false);
            return;
        }
        const from = selectedMove.slice(0, 2) as Square;
        const to = selectedMove.slice(2, 4) as Square;
        const promotion = selectedMove.slice(4, 5) as "q" | "r" | "b" | "n" | "";
        // Validate hints and computer moves against the exact current position.
        const legal = game.moves({ verbose: true }).some(move =>
            move.from === from && move.to === to && (move.promotion ?? "") === promotion
        );
        const expectedColor = action.kind === "hint" ? playerColor : aiSideRef.current;
        if (game.turn() !== expectedColor || !legal) {
            setIsAiThinking(false);
            return;
        }
        if (action.kind === "hint") {
            displayedHintFenRef.current = action.fen;
            setHintMove({ from, to });
            setHintsLeft(prev => Math.max(0, prev - 1));
            return;
        }

        const aiMove = moveAiPiece(from, to, promotion || undefined);
        const status = checkGameStatus();
        playMoveResultSound(aiMove, status);
        setLastMove({ from, to });
        setFen(game.fen());
        scheduleTask(() => setIsAiThinking(false), 300, getFen());

        if (status === "checkmate") {
            const winner = game.turn() === "w" ? "b" : "w";
            if (winner !== playerColor) {
                scheduleTask(() => setShowLooseModal(true), 1000, getFen());
            }
            return;
        }
        if (status === "stalemate" || status === "draw") return;

        saveMatchState({
            fen: getFen(),
            pgn: getPGN(),
            playerColor,
            selectedSquare,
            aiColor: aiSideRef.current,
            lastMove: { from, to },
            savedAt: new Date().toISOString(),
            difficulty: selectedDifficulty,
        });
    };

    useFocusEffect(React.useCallback(() => {
        let cancelled = false;
        activeRef.current = true;
        initialTurnCheckedRef.current = null;

        if (!initializedRef.current) {
            scheduleTask(() => setShowClaimModal(true), 1000);
            loadMatchState().then((savedState) => {
                if (cancelled || !activeRef.current) return;
                if (savedState) {
                    loadFEN(savedState.fen);
                    loadPGN(savedState.pgn);
                    setPlayerColor(savedState.playerColor);
                    setLastMove(savedState.lastMove ?? null);
                    aiSideRef.current = savedState.aiColor;
                    setSelectedDifficulty(savedState.difficulty);
                    setSelectedSquare(savedState.selectedSquare);
                } else {
                    cancelSearch(ownerRef.current, true);
                    resetGame();
                    saveMatchState({
                        fen: getFen(),
                        playerColor,
                        pgn: getPGN(),
                        selectedSquare,
                        aiColor: aiSideRef.current,
                        lastMove: { from: null, to: null },
                        savedAt: new Date().toISOString(),
                        difficulty: selectedDifficulty,
                    });
                }
                initializedRef.current = true;
                setFen(game.fen());
                setMatchInitialization(0);
                if (game.isCheckmate()) {
                    const winner = game.turn() === "w" ? "b" : "w";
                    if (winner === (savedState?.playerColor ?? playerColor)) setShowWinModal(true);
                }
            }).catch(error => {
                if (!cancelled) console.log("Could not initialize match:", error);
            });
            loadWins().then(wins => {
                if (!cancelled && activeRef.current && wins) setNumOfWins(wins);
            });
            loadHints().then(hints => {
                if (!cancelled && activeRef.current && hints) setHintsLeft(hints);
            });
        }

        return () => {
            cancelled = true;
            activeRef.current = false;
            cancelPendingWork();
        };
        // Initial settings are used only when there is no snapshot; restored settings are applied above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cancelPendingWork, cancelSearch, scheduleTask]));

    // Check once per initialization/restart, after the position and opponent are ready.
    useEffect(() => {
        if (!isFocused || !activeRef.current || !isMatchReady || !isOpponentReady || initialTurnCheckedRef.current === matchInitialization) return;

        initialTurnCheckedRef.current = matchInitialization;
        getAiMove();
    });

    useEffect(() => {
        if (isFocused && isMatchReady && engineError && selectedDifficulty !== "rookie") {
            Alert.alert("Computer unavailable", engineError);
        }
    }, [engineError, isFocused, isMatchReady, selectedDifficulty]);

    useEffect(() => {
        const result = winResultRef.current;
        const subscription = checkmatePlayer.addListener(
            "playbackStatusUpdate",
            (status) => {
                if (status.didJustFinish && result && winResultRef.current === result &&
                    activeRef.current && result.version === versionRef.current && result.fen === getFen() &&
                    game.isCheckmate() && game.turn() !== playerColor) {
                    winResultRef.current = null;
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
    });




    return (

        <View style={styles.screen}>
            <Modal
                visible={isFocused && showExitModal}
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
                                    activeRef.current = false;
                                    cancelPendingWork(true);
                                    clearMatchState();
                                    resetGame();

                                    setSelectedSquare(null);
                                    setLegalMoves([]);
                                    setLastMove(null);
                                    setFen(game.fen());

                                    router.replace("ComputerSettings");
                                }}

                                style={[styles.modalButton, styles.leaveButton]}
                            >
                                <Text style={styles.leaveButtonText}>Leave</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <WinModal visible={isFocused && showWinModal}
                wins={numOfWins}
                requiredWins={requiredNumOfWins}
                setHintsLeft={setHintsLeft}
                onNewGame={() => {
                    activeRef.current = false;
                    cancelPendingWork(true);
                    clearMatchState();

                    resetGame();

                    setSelectedSquare(null);
                    setLegalMoves([]);
                    setLastMove(null);
                    setIllegalSquare(null);
                    setSquareInCheck("");
                    setIsCheckmate(false);
                    setPromotionMove(null);

                    setFen(game.fen());

                    router.replace("ComputerSettings");
                }}
                onGameView={() => {
                    // setShowWinModal(false);
                }}
                onClose={() => setShowWinModal(false)}
            />

            <LooseModal
                visible={isFocused && showLooseModal}
                onNewGame={() => {
                    activeRef.current = false;
                    cancelPendingWork(true);
                    clearMatchState();

                    resetGame();

                    setSelectedSquare(null);
                    setLegalMoves([]);
                    setLastMove(null);
                    setIllegalSquare(null);
                    setSquareInCheck("");
                    setIsCheckmate(false);
                    setPromotionMove(null);

                    setFen(game.fen());

                    router.replace("ComputerSettings");
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
            <PromotionModal visible={isFocused && promotionMove !== null} playerColor={playerColor} onPromote={handlePromotion} />
            <SettingsModal visible={isFocused && showSettings} onClose={() => setShowSettings(false)} />
            <Header
                onBack={() => {
                    activeRef.current = false;
                    cancelPendingWork(true);
                    game.reset();
                    setFen(game.fen());
                    setLastMove(null);
                    setSelectedSquare(null);
                    setLegalMoves([]);
                    playSound(illegalPlayer)
                    clearMatchState()
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
                            if (!activeRef.current || !isMatchReady) return;
                            cancelPendingWork(true);
                            playSound(capturePlayer);
                            clearMatchState();
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
