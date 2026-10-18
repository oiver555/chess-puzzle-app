import ActionButton from "@/components/ActionButton";
import AdBanner from "@/components/AdBanner";
import ChessBoard from "@/components/Chessboard";
import PromotionModal from "@/components/PromotionModal";
import { COLORS } from "@/theme/colors";
import { Difficulty, LastMove } from "@/types/match";
import { awardVictory, createMatchId, clearMatchState as removeMatchState, isSupportedDifficulty, loadProgress, loadMatchState, saveHints, saveMatchState as persistMatchState } from "@/util/storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Square } from "chess.js";
import { useAudioPlayer } from "expo-audio";
import { router, useFocusEffect, useIsFocused, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
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
    loadPGN
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

// Serialize every Match write/delete across screen instances and launch identities.
let matchStorageQueue: Promise<void> = Promise.resolve();
let initializationVersion = 0;

function queueMatchSave(state: Parameters<typeof persistMatchState>[0], isAbandoned: () => boolean, beforeWrite?: Promise<unknown>) {
    // Observe a failed award even while an earlier board write is still pending.
    void beforeWrite?.catch(() => {});
    const write = matchStorageQueue.catch(() => {}).then(async () => {
        await beforeWrite;
        if (!isAbandoned()) return persistMatchState(state);
    });
    matchStorageQueue = write;
    // Callers that await still receive errors; fire-and-forget move saves are observed.
    void write.catch(error => console.log("Could not save match:", error));
    return write;
}

function clearMatchState() {
    const removal = matchStorageQueue.catch(() => {}).then(() => removeMatchState());
    matchStorageQueue = removal;
    void removal.catch(error => console.log("Could not clear match:", error));
    return removal;
}

type SkilledCandidate = { move: string; score: number | null };

type PendingAction = {
    kind: "aiMove" | "hint";
    version: number;
    fen: string;
    skilledAnalysis?: {
        expected: number;
        depth: number;
        candidates: Map<number, SkilledCandidate>;
        completed?: SkilledCandidate[];
    };
};

const Match = () => {
    const { side, difficulty, intent, launchId } = useLocalSearchParams<{
        side?: "w" | "b" | "r"; difficulty?: Difficulty;
        intent?: "new" | "recover"; launchId?: string;
    }>();
    const launchIdentity = `${intent ?? "recover"}:${launchId ?? "legacy"}:${side ?? ""}:${difficulty ?? ""}`;
    const abandonedLaunchesRef = React.useRef(new Set<string>());
    const isAbandoned = React.useCallback(() => abandonedLaunchesRef.current.has(launchIdentity), [launchIdentity]);
    const matchIdRef = React.useRef<string | null>(null);
    const saveMatchState = (state: Parameters<typeof persistMatchState>[0], beforeWrite?: Promise<unknown>) =>
        queueMatchSave({ ...state, matchId: matchIdRef.current ?? undefined }, isAbandoned, beforeWrite);
    const navigation = useNavigation();
    const exitInFlightRef = React.useRef<Promise<void> | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>(isSupportedDifficulty(difficulty) ? difficulty : "rookie")
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
        else if (side === "b") { return "b" }
        else return "w"
    })
    const { requestSearch, cancelSearch, isEngineReady, engineError } = useStockfishContext();
    const isFocused = useIsFocused();
    const [matchInitialization, setMatchInitialization] = React.useState<number | null>(null);
    const initialTurnCheckedRef = React.useRef<number | null>(null);
    const [readyLaunch, setReadyLaunch] = React.useState<string | null>(null);
    const isMatchReady = matchInitialization !== null && readyLaunch === launchIdentity;
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
    const initializedRef = React.useRef<string | null>(null);
    const launchSettingsRef = React.useRef<{
        identity: string; color: "w" | "b"; difficulty: Difficulty;
    } | null>(null);
    const terminalResultRef = React.useRef<{
        launch: string; version: number; fen: string;
    } | null>(null);
    const [hintMove, setHintMove] = React.useState<{ from: Square; to: Square } | null>(null);
    const displayedHintFenRef = React.useRef<string | null>(null);
    const [hintsLeft, setHintsLeft] = React.useState(0);
    const hintsBalanceRef = React.useRef<number | null>(null);
    const [isAiThinking, setIsAiThinking] = React.useState(false);
    const [numOfWins, setNumOfWins] = React.useState(0);
    const winsRef = React.useRef(0);

    const updateHintBalance = (change: number) => {
        const balance = hintsBalanceRef.current;
        if (balance === null || !activeRef.current || isAbandoned()) return false;
        const nextBalance = balance + change;
        if (!Number.isSafeInteger(nextBalance) || nextBalance < 0) return false;
        hintsBalanceRef.current = nextBalance;
        setHintsLeft(nextBalance);
        void saveHints(nextBalance).catch(error => {
            console.log("Could not save hint balance:", error);
            if (activeRef.current && !isAbandoned()) {
                Alert.alert("Hint balance not saved", "Your hint balance changed for this session, but could not be saved. It may be lost if the app closes. Saving will be retried with the next balance update or match.");
            }
        });
        return true;
    };

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

    const abandonMatch = React.useCallback(async (action: Parameters<typeof navigation.dispatch>[0]) => {
        if (exitInFlightRef.current) return;
        abandonedLaunchesRef.current.add(launchIdentity);
        activeRef.current = false;
        initializedRef.current = null;
        const generation = ++initializationVersion;
        cancelPendingWork(true);
        const exitVersion = versionRef.current;
        setMatchInitialization(null);
        setReadyLaunch(null);
        setShowExitModal(false);

        // A write already inside AsyncStorage cannot be cancelled. Queue deletion
        // after it; queued/future saves from this lifetime are skipped.
        const removal = clearMatchState();
        exitInFlightRef.current = removal;
        try {
            await removal;
            if (generation === initializationVersion && versionRef.current === exitVersion) {
                navigation.dispatch(action);
            }
        } catch (error) {
            // Keep the route in place on failure; the existing Back control can retry.
            console.log("Could not discard match before leaving:", error);
        } finally {
            if (exitInFlightRef.current === removal) exitInFlightRef.current = null;
        }
    }, [cancelPendingWork, launchIdentity, navigation]);

    // Covers app buttons, Android navigation Back, and native back gestures.
    // Replaying this action is supported by usePreventRemove without prompting again.
    usePreventRemove(true, ({ data }) => {
        void abandonMatch(data.action);
    });

    const isCurrentAction = (action: PendingAction) =>
        !isAbandoned() && activeRef.current && actionRef.current === action &&
        versionRef.current === action.version && getFen() === action.fen;

    const startEngineAction = (action: PendingAction) => {
        if (action.kind === "aiMove" && selectedDifficulty === "rookie") return;
        if (action.kind === "aiMove" && selectedDifficulty === "skilled") {
            action.skilledAnalysis = {
                expected: Math.min(4, game.moves().length),
                depth: 0,
                candidates: new Map(),
            };
        }
        requestSearch({
            owner: ownerRef.current,
            fen: action.fen,
            profile: action.kind === "hint" ? "hint" : selectedDifficulty as Exclude<Difficulty, "rookie">,
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
        if (!activeRef.current || !isMatchReady || isAbandoned() || game.isGameOver() || !promotionMove) return;
        const from = promotionMove.from;
        const to = promotionMove.to;

        if (!from || game.turn() !== playerColor || !game.moves({ square: from, verbose: true }).some(
            move => move.to === to && move.promotion === promotion)) return;

        cancelPendingWork();
        const promotedMove = movePiece(from, to, promotion);
        if (handleTerminalResult({ from, to })) return;
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
        checkGameStatus();
        playMoveResultSound(promotedMove, "promotion");
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
        if (hintsBalanceRef.current === null || hintsBalanceRef.current <= 0 || game.turn() !== playerColor) return;
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
        if (!activeRef.current || !isMatchReady || game.isGameOver()) return;
        const history = game.history({ verbose: true });
        let humanMoveIndex = history.length - 1;
        while (humanMoveIndex >= 0 && history[humanMoveIndex].color !== playerColor) humanMoveIndex--;
        if (humanMoveIndex < 0) return;

        playSound(capturePlayer);
        cancelPendingWork();
        // Remove the latest human move and any computer response to it.
        for (let index = history.length; index > humanMoveIndex; index--) game.undo();
        const previousMove = game.history({ verbose: true }).at(-1);
        const restoredLastMove = previousMove ? { from: previousMove.from, to: previousMove.to } : null;
        saveMatchState({
            fen: getFen(), pgn: getPGN(), playerColor, aiColor: aiSideRef.current,
            difficulty: selectedDifficulty, selectedSquare: null,
            lastMove: restoredLastMove, savedAt: new Date().toISOString(),
        });
        setLastMove(restoredLastMove);

        setSelectedSquare(null);
        setLegalMoves([]);
        setIsCheckmate(game.isCheckmate());
        if (game.isCheck()) updateCheckSquare();
        else setSquareInCheck("");
        setFen(game.fen());
        setMatchInitialization(previous => (previous ?? 0) + 1);
    };

    const handleTerminalResult = (move: LastMove) => {
        if (!game.isGameOver()) return false;
        if (!activeRef.current || isAbandoned()) return true;
        const fen = getFen();
        const previous = terminalResultRef.current;
        if (previous?.launch === launchIdentity && previous.fen === fen) return true;

        cancelPendingWork();
        const result = { launch: launchIdentity, version: versionRef.current, fen };
        terminalResultRef.current = result;
        const isCurrentResult = () => activeRef.current && !isAbandoned() &&
            terminalResultRef.current === result && versionRef.current === result.version && getFen() === fen;
        const checkmate = game.isCheckmate();
        const humanWon = checkmate && game.turn() !== playerColor;
        setIsCheckmate(checkmate);
        if (game.isCheck()) updateCheckSquare();
        else setSquareInCheck("");
        setLastMove(move);
        setSelectedSquare(null);
        setLegalMoves([]);
        setFen(fen);

        const award = humanWon ? awardVictory(matchIdRef.current ?? "").then(progress => {
            if (isCurrentResult()) {
                winsRef.current = progress.wins;
                setNumOfWins(progress.wins);
                hintsBalanceRef.current = progress.hints;
                setHintsLeft(progress.hints);
            }
        }) : undefined;
        // Keep board ordering, but never make a victory unrecoverable before its award.
        const persisted = saveMatchState({
            fen, pgn: getPGN(), playerColor, aiColor: aiSideRef.current,
            difficulty: selectedDifficulty, selectedSquare: null, lastMove: move,
            savedAt: new Date().toISOString(),
        }, award);

        if (checkmate) {
            if (humanWon) {
                setShowWinModal(true);
            } else {
                setShowLooseModal(true);
            }
        } else {
            const reason = game.isStalemate() ? "Stalemate: there are no legal moves, but the king is not in check."
                : game.isThreefoldRepetition() ? "Draw by threefold repetition."
                : game.isDrawByFiftyMoves() ? "Draw by the fifty-move rule."
                : game.isInsufficientMaterial() ? "Draw by insufficient material."
                : "The game ended in a draw.";
            Alert.alert("Draw", reason);
        }

        // Audio cannot block a result or resurrect it after cancellation/navigation.
        void persisted.then(async () => {
            if (!isCurrentResult()) return;
            const player = checkmate ? (humanWon ? checkmatePlayer : loosePlayer) : drawPlayer;
            await playSound(player, isCurrentResult);
        }, () => {
            // Neither the board nor the award is claimed to be durable on failure.
            if (humanWon && isCurrentResult()) {
                Alert.alert("Victory not fully saved", "The result could not be fully saved. Pending victory credit will be retried when the next match loads. If the initial award write failed, the earlier unfinished position remains recoverable.");
            }
        });
        return true;
    };

    const playMoveResultSound = (move: any, status: string) => {
        // Terminal outcomes are processed exclusively by handleTerminalResult.
        try {
            if (status === "check") {
                playSound(movePlayer);
                playSound(checkPlayer);
            }
            if (status === "promotion") {
                playSound(promotionPlayer);
                return;
            }
            if (status === "illegal") {
                playSound(illegalPlayer);
                return;
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
        } catch (error) {
            console.log("Could not play move audio:", error);
        }
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

            if (handleTerminalResult({ from: randomMove.from, to: randomMove.to })) return;
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
        if (!activeRef.current || !isMatchReady || !isOpponentReady || isAbandoned() || game.isGameOver()) return;
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
            if (handleTerminalResult({ from: selectedSquare, to: squareName })) return;
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

    const reportInvalidEngineMove = (action: PendingAction) => {
        if (!isCurrentAction(action)) return;
        cancelPendingWork();
        if (action.kind === "hint") {
            Alert.alert("Hint unavailable", "No valid hint was received. No hint was used. You can try again.");
            return;
        }
        const version = versionRef.current;
        Alert.alert("Computer move unavailable", "No valid move was received. Retry the computer move or restart the match.", [
            { text: "Close", style: "cancel" },
            { text: "Retry", onPress: () => {
                if (activeRef.current && versionRef.current === version && getFen() === action.fen) getAiMove();
            } },
        ]);
    };

    const recordSkilledAnalysis = (output: string, action: PendingAction) => {
        const analysis = action.skilledAnalysis;
        if (!analysis) return;
        const depthMatch = /\bdepth (\d+)\b/.exec(output);
        const rankMatch = /\bmultipv (\d+)\b/.exec(output);
        const scoreMatch = /\bscore (cp|mate) (-?\d+)\b/.exec(output);
        const moveMatch = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)(?:\s|$)/.exec(output);
        if (!depthMatch || !rankMatch || !scoreMatch || !moveMatch) return;
        const depth = Number(depthMatch[1]);
        const rank = Number(rankMatch[1]);
        if (depth < 1 || depth < analysis.depth || rank < 1 || rank > analysis.expected) return;
        if (depth > analysis.depth) {
            analysis.depth = depth;
            analysis.candidates.clear();
        }
        analysis.candidates.set(rank, {
            move: moveMatch[1],
            score: scoreMatch[1] === "cp" && !/\b(?:lowerbound|upperbound)\b/.test(output)
                ? Number(scoreMatch[2]) : null,
        });
        if (analysis.candidates.size === analysis.expected) {
            // Snapshot one complete depth; a partial deeper iteration must not mix scores.
            analysis.completed = Array.from({ length: analysis.expected }, (_, index) =>
                analysis.candidates.get(index + 1)!);
        }
    };

    const selectSkilledMove = (action: PendingAction, bestmove: string, legalMoves: string[]) => {
        const candidates = action.skilledAnalysis?.completed;
        if (!candidates || Math.random() < 0.6) return bestmove;
        if (new Set(candidates.map(candidate => candidate.move)).size !== candidates.length) return bestmove;
        const top = candidates[0];
        const final = candidates.find(candidate => candidate.move === bestmove);
        if (top.score === null || !legalMoves.includes(top.move) || !final || final.score === null) return bestmove;
        // UCI scores are relative to the root side to move, for both White and Black.
        // All candidates belong to this action's FEN, so higher always favors the computer.
        const topScore = top.score;
        const finalScore = final.score;
        const alternatives = candidates.filter(candidate => candidate.score !== null &&
            legalMoves.includes(candidate.move) && topScore - candidate.score >= 100 &&
            topScore - candidate.score <= 300 && finalScore - candidate.score >= 50);
        return alternatives.length ? alternatives[Math.floor(Math.random() * alternatives.length)].move : bestmove;
    };

    const handleEngineOutput = (output: string, action: PendingAction) => {
        const cleanOutput = output.trim();
        if (!isCurrentAction(action) || game.isGameOver()) return;
        if (cleanOutput.startsWith("info ")) recordSkilledAnalysis(cleanOutput, action);

        const cpMatch = cleanOutput.match(/score cp (-?\d+)/);
        if (cpMatch) setEvalScore(Number(cpMatch[1]) / 100);
        if (!cleanOutput.startsWith("bestmove")) return;

        const result = /^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)(?:\s+ponder\s+[a-h][1-8][a-h][1-8][qrbn]?)?$/.exec(cleanOutput);
        if (!result) {
            reportInvalidEngineMove(action);
            return;
        }
        // Validate hints and computer moves against the exact current position.
        const legalMoves = game.moves({ verbose: true }).map(move => move.from + move.to + (move.promotion ?? ""));
        const expectedColor = action.kind === "hint" ? playerColor : aiSideRef.current;
        if (game.turn() !== expectedColor || !legalMoves.includes(result[1])) {
            reportInvalidEngineMove(action);
            return;
        }
        const selectedMove = action.skilledAnalysis
            ? selectSkilledMove(action, result[1], legalMoves) : result[1];
        const from = selectedMove.slice(0, 2) as Square;
        const to = selectedMove.slice(2, 4) as Square;
        const promotion = selectedMove.slice(4, 5) as "q" | "r" | "b" | "n" | "";
        actionRef.current = null;
        if (action.kind === "hint") {
            if (!updateHintBalance(-1)) return;
            displayedHintFenRef.current = action.fen;
            setHintMove({ from, to });
            return;
        }

        const aiMove = moveAiPiece(from, to, promotion || undefined);
        if (handleTerminalResult({ from, to })) return;
        const status = checkGameStatus();
        playMoveResultSound(aiMove, status);
        setLastMove({ from, to });
        setFen(game.fen());
        scheduleTask(() => setIsAiThinking(false), 300, getFen());

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
        if (isAbandoned()) return;
        activeRef.current = true;
        initialTurnCheckedRef.current = null;

        if (initializedRef.current !== launchIdentity) {
            cancelPendingWork(true);
            terminalResultRef.current = null;
            setMatchInitialization(null);
            setReadyLaunch(null);
            hintsBalanceRef.current = null;
            const generation = ++initializationVersion;
            const isCurrentInitialization = () =>
                !cancelled && !isAbandoned() && activeRef.current && generation === initializationVersion;
            if (launchSettingsRef.current?.identity !== launchIdentity) {
                launchSettingsRef.current = {
                    identity: launchIdentity,
                    color: side === "r" ? (Math.random() < 0.5 ? "w" : "b") : side === "b" ? "b" : "w",
                    difficulty: isSupportedDifficulty(difficulty) ? difficulty : "rookie",
                };
            }
            const settings = launchSettingsRef.current;
            scheduleTask(() => setShowClaimModal(true), 1000);
            void (async () => {
                // Earlier move saves/deletes must finish before any recovery read or replacement.
                await matchStorageQueue.catch(() => {});
                if (!isCurrentInitialization()) return;
                const progress = await loadProgress();
                if (!isCurrentInitialization()) return;
                hintsBalanceRef.current = progress.hints;
                setHintsLeft(progress.hints);
                winsRef.current = progress.wins;
                setNumOfWins(progress.wins);
                let savedState = null;
                if (intent !== "new") {
                    try {
                        savedState = await loadMatchState();
                    } catch {
                        if (!isCurrentInitialization()) return;
                        Alert.alert("Saved match unavailable", "The saved match could not be restored. A fresh match will start with your launch settings (White and Rookie by default).");
                    }
                }
                if (!isCurrentInitialization()) return;
                const color = savedState?.playerColor ?? settings.color;
                const matchDifficulty = savedState?.difficulty ?? settings.difficulty;
                matchIdRef.current = savedState?.matchId ?? createMatchId();
                if (savedState) loadPGN(savedState.pgn);
                else resetGame();
                setPlayerColor(color);
                setSelectedDifficulty(matchDifficulty);
                aiSideRef.current = color === "w" ? "b" : "w";
                setLastMove(savedState?.lastMove ?? null);
                setSelectedSquare(savedState?.selectedSquare ?? null);
                setLegalMoves([]);
                setIsCheckmate(game.isCheckmate());
                if (game.isCheck()) updateCheckSquare();
                else setSquareInCheck("");
                setEvalScore(0);
                if (!savedState || !savedState.matchId) {
                    await queueMatchSave({
                        fen: getFen(), pgn: getPGN(), playerColor: color,
                        selectedSquare: null, aiColor: aiSideRef.current,
                        lastMove: savedState?.lastMove ?? null, savedAt: new Date().toISOString(),
                        difficulty: matchDifficulty,
                        matchId: matchIdRef.current,
                    }, isAbandoned);
                }
                if (!isCurrentInitialization()) return;
                initializedRef.current = launchIdentity;
                setFen(game.fen());
                setReadyLaunch(launchIdentity);
                setMatchInitialization(previous => (previous ?? 0) + 1);
            })().catch(error => {
                if (isCurrentInitialization()) {
                    console.log("Could not initialize match:", error);
                    Alert.alert("Match unavailable", "The match could not be initialized. Leave this screen and try again.");
                }
            });
        }

        return () => {
            cancelled = true;
            activeRef.current = false;
            cancelPendingWork();
        };
    }, [cancelPendingWork, difficulty, intent, isAbandoned, launchIdentity, scheduleTask, side]));

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
                                onPress={() => router.replace("ComputerSettings")}

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
                onNewGame={() => router.replace("ComputerSettings")}
                onGameView={() => {
                    // setShowWinModal(false);
                }}
                onClose={() => setShowWinModal(false)}
            />

            <LooseModal
                visible={isFocused && showLooseModal}
                onNewGame={() => router.replace("ComputerSettings")}
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
                    playSound(illegalPlayer);
                    router.replace("ComputerSettings");
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
                        onPress={async () => {
                            if (!activeRef.current || !isMatchReady) return;
                            cancelPendingWork(true);
                            const restartVersion = versionRef.current;
                            terminalResultRef.current = null;
                            setReadyLaunch(null);
                            matchIdRef.current = createMatchId();
                            try {
                                playSound(capturePlayer);
                            } catch (error) {
                                console.log("Could not play restart sound:", error);
                            }
                            resetGame();
                            const persisted = saveMatchState({
                                fen: getFen(), pgn: getPGN(), playerColor,
                                aiColor: aiSideRef.current, difficulty: selectedDifficulty,
                                selectedSquare: null, lastMove: null, savedAt: new Date().toISOString(),
                            });
                            setSelectedSquare(null);
                            setLegalMoves([]);
                            setLastMove(null);
                            setIllegalSquare(null);
                            setSquareInCheck("");
                            setIsCheckmate(false);
                            setPromotionMove(null);

                            setFen(game.fen());
                            try {
                                // Reload accounting too: an earlier victory may still be pending.
                                await persisted;
                                const progress = await loadProgress();
                                if (!activeRef.current || isAbandoned() || versionRef.current !== restartVersion) return;
                                winsRef.current = progress.wins;
                                setNumOfWins(progress.wins);
                                hintsBalanceRef.current = progress.hints;
                                setHintsLeft(progress.hints);
                            } catch (error) {
                                console.log("Could not restart match:", error);
                                if (activeRef.current && !isAbandoned() && versionRef.current === restartVersion) {
                                    Alert.alert("Match unavailable", "The new match could not be saved or its progress loaded. Leave this screen and try again.");
                                }
                                return;
                            }
                            setReadyLaunch(launchIdentity);
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
                        label="UNDO" onPress={undoMove} />
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
