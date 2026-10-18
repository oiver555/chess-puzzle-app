import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Chess, Square } from "chess.js";
import ChessBoard from "../components/Chessboard";
import RewardModal from "@/components/RewardModal";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import MasteryCircle from "@/components/MasteryCircle";
import { Opening, OpeningProgress } from "@/data/openings";
import { LastMove } from "@/types/match";
import { getOpeningProgress, getOpeningProgressResetVersion, subscribeOpeningProgress, updateOpeningProgress } from "@/util/storage";
import { resolveOpeningRoute, validMasteryPercent } from "@/util/openingRoute";
import OpeningUnavailable, { backToOpenings } from "@/components/OpeningUnavailable";

export type MoveDetail = {
    order: string;
    move: string;
    side: "white" | "black";
    piece: string;
    text?: string;
    commentary?: string;
};

type PracticeRun = {
    game: Chess;
    index: number;
    correctMoves: number;
    totalAttempts: number;
    phase: "student" | "opponent" | "complete" | "error";
    saveStatus: "idle" | "saving" | "saved" | "failed";
    progress: OpeningProgress | null;
    rewardEligible: boolean;
    progressResetVersion?: number;
};

function createRun(opening: Opening): PracticeRun {
    const game = new Chess();
    const index = opening.side === "black" ? 1 : 0;
    if (index) game.move(opening.moves[0]);
    return {
        game, index, correctMoves: 0, totalAttempts: 0, phase: "student",
        saveStatus: "idle", progress: null, rewardEligible: false,
    };
}

export default function OpeningPractice() {
    const params = useLocalSearchParams();
    const openingData = resolveOpeningRoute(params);
    return openingData ? <PracticeLesson key={openingData.eco} openingData={openingData} /> : <OpeningUnavailable />;
}

function PracticeLesson({ openingData }: { openingData: Opening }) {
    const playerColor = openingData.side === "black" ? "b" : "w";
    const [initialRun] = useState(() => createRun(openingData));
    // This synchronous record also guards against taps arriving before React renders.
    const runRef = useRef(initialRun);
    const [game, setGame] = useState(initialRun.game);
    const [moveIndex, setMoveIndex] = useState(initialRun.index);
    const [showReward, setShowReward] = useState(false);
    const [lastMove, setLastMove] = useState<LastMove>(null);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);
    // Route mastery is deliberately ignored; saved progress is authoritative.
    const [masteryPercent, setMasteryPercent] = useState(0);
    const [feedback, setFeedback] = useState("Recall the next move in this opening.");
    const [saveStatus, setSaveStatus] = useState<PracticeRun["saveStatus"]>("idle");
    const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const active = useRef(false);
    const mounted = useRef(false);
    const [isFocused, setIsFocused] = useState(false);

    const cancelResponse = useCallback(() => {
        if (responseTimer.current !== null) clearTimeout(responseTimer.current);
        responseTimer.current = null;
    }, []);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            active.current = false;
            cancelResponse();
        };
    }, [cancelResponse]);

    useFocusEffect(useCallback(() => {
        active.current = true;
        setIsFocused(true);
        let cancelled = false;
        let request = 0;
        async function loadMastery() {
            const current = ++request;
            const run = runRef.current;
            try {
                const progress = await getOpeningProgress(openingData.name);
                if (!cancelled && current === request && runRef.current === run && run.saveStatus === "idle") {
                    setMasteryPercent(validMasteryPercent(progress?.mastery));
                }
            } catch (error) {
                console.log("Could not load practice mastery:", error);
            }
        }
        const unsubscribe = subscribeOpeningProgress(change => {
            if (change === "reset") {
                request++;
                setMasteryPercent(0);
            }
        });
        void loadMastery();
        return () => {
            cancelled = true;
            unsubscribe();
            active.current = false;
            setIsFocused(false);
            cancelResponse();
            setShowReward(false);
        };
    }, [cancelResponse, openingData.name]));

    async function saveOpeningProgress(run: PracticeRun) {
        if (run.saveStatus === "saving" || run.saveStatus === "saved") return;
        run.saveStatus = "saving";
        setSaveStatus("saving");
        try {
            const openingId = openingData.name;
            const progress = await updateOpeningProgress(openingId, savedProgress => {
                run.progressResetVersion ??= getOpeningProgressResetVersion();
                const previous = savedProgress ?? {
                    openingId, mastery: 0, completedReps: 0, correctMoves: 0, totalAttempts: 0,
                };
                // Retain the same award on retry, even if a failed write actually persisted.
                if (!run.progress) {
                    const nextMastery = Math.min(previous.mastery + 20, 100);
                    run.rewardEligible = previous.mastery < 100 && nextMastery === 100;
                    run.progress = {
                        ...previous,
                        mastery: nextMastery,
                        completedReps: previous.completedReps + 1,
                        correctMoves: previous.correctMoves + run.correctMoves,
                        totalAttempts: previous.totalAttempts + run.totalAttempts,
                        lastPracticedAt: new Date().toISOString(),
                    };
                }
                return run.progress;
            }, run.progressResetVersion);
            run.saveStatus = "saved";
            if (mounted.current && runRef.current === run) {
                setSaveStatus("saved");
                if (!progress || run.progressResetVersion !== getOpeningProgressResetVersion()) {
                    setMasteryPercent(0);
                    setShowReward(false);
                    setFeedback("Learning progress was reset. Reset practice to start a new run.");
                    return;
                }
                setMasteryPercent(progress.mastery);
                setFeedback("Practice complete! Progress saved.");
                if (active.current && run.rewardEligible) setShowReward(true);
            }
        } catch {
            run.progressResetVersion ??= getOpeningProgressResetVersion();
            run.saveStatus = "failed";
            if (mounted.current && runRef.current === run) {
                setSaveStatus("failed");
                setFeedback("Practice complete. Progress could not be saved. Tap Retry save.");
            }
        }
    }

    function finishPractice(run: PracticeRun) {
        const studentMoves = openingData.uci.filter((_, index) =>
            index % 2 === (playerColor === "w" ? 0 : 1)).length;
        if (!active.current || runRef.current !== run || run.phase === "complete" ||
            run.index !== openingData.uci.length || run.correctMoves !== studentMoves) return;
        run.phase = "complete";
        setFeedback("Practice complete! Saving progress...");
        void saveOpeningProgress(run);
    }

    // On refocus, resume a cancelled opponent response from the unchanged position.
    useEffect(() => {
        const run = runRef.current;
        if (!isFocused || !active.current || run.phase !== "opponent" ||
            responseTimer.current !== null) return;
        const index = run.index;
        const fen = run.game.fen();
        const timer = setTimeout(() => {
            if (responseTimer.current !== timer || !active.current ||
                runRef.current !== run || run.phase !== "opponent" ||
                run.index !== index || run.game.fen() !== fen) return;
            responseTimer.current = null;
            try {
                const nextGame = new Chess(fen);
                const move = nextGame.move(openingData.moves[index]);
                if (move.from + move.to + (move.promotion ?? "") !== openingData.uci[index]) {
                    throw new Error("Lesson response does not match its UCI sequence");
                }
                run.game = nextGame;
                run.index++;
                run.phase = "student";
                setGame(nextGame);
                setMoveIndex(run.index);
                setLastMove({ from: move.from, to: move.to });
                if (run.index === openingData.uci.length) finishPractice(run);
                else setFeedback("Your turn. Recall the next move.");
            } catch {
                run.phase = "error";
                setFeedback("The lesson response could not be played. Reset to try again.");
            }
        }, 500);
        responseTimer.current = timer;
    });

    const handleMove = (from: Square, to: Square) => {
        const run = runRef.current;
        if (!active.current || run.phase !== "student" || run.game.turn() !== playerColor) return;
        const move = run.game.moves({ square: from, verbose: true }).find(candidate =>
            candidate.to === to && (!candidate.promotion || candidate.promotion === "q"));
        if (!move) return;
        run.totalAttempts++;
        if (move.from + move.to + (move.promotion ?? "") !== openingData.uci[run.index]) {
            setFeedback("That move is legal, but it isn't in this lesson. Try again.");
            return;
        }
        const nextGame = new Chess(run.game.fen());
        nextGame.move({ from, to, promotion: "q" });
        run.game = nextGame;
        run.index++;
        run.correctMoves++;
        setGame(nextGame);
        setMoveIndex(run.index);
        setLastMove({ from, to });
        if (run.index === openingData.uci.length) finishPractice(run);
        else {
            run.phase = "opponent";
            setFeedback("Correct! Waiting for the opponent...");
        }
    };

    const handleSquarePress = (square: Square) => {
        const run = runRef.current;
        if (!active.current || run.phase !== "student" || run.game.turn() !== playerColor) return;
        if (selectedSquare && legalMoves.includes(square)) {
            handleMove(selectedSquare, square);
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }
        const piece = run.game.get(square);
        if (piece?.color === playerColor) {
            setSelectedSquare(square);
            setLegalMoves(run.game.moves({ square, verbose: true }).map(move => move.to));
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const resetPractice = () => {
        // Keep a completed run's storage update from racing a new run.
        if (runRef.current.saveStatus === "saving") return;
        cancelResponse();
        const run = createRun(openingData);
        runRef.current = run;
        setGame(run.game);
        setMoveIndex(run.index);
        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove(null);
        setShowReward(false);
        setSaveStatus("idle");
        setFeedback("Recall the next move in this opening.");
    };

    const exitPractice = () => {
        active.current = false;
        cancelResponse();
        setShowReward(false);
        backToOpenings();
    };

    return (
        <LinearGradient style={{ flex: 1 }} colors={[COLORS.header.dark, COLORS.header.dark2]} >
            <SafeAreaView style={styles.container} >

                <View style={styles.header}>
                    <Pressable
                        style={styles.headerButton}
                        onPress={exitPractice}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={28}
                            color={COLORS.text.primary}
                        />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Practice</Text>
                        <View style={styles.headerSubtitleRow}>
                            <Text style={styles.headerSubtitle}>
                                {openingData.name}
                            </Text>
                        </View>
                    </View>

                    <Pressable style={styles.headerButton}>
                        <Ionicons
                            name="settings-sharp"
                            size={24}
                            color={COLORS.text.primary}
                        />
                    </Pressable>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.targetCard}>
                        <Ionicons
                            name="radio-button-on"
                            size={34}
                            color={openingData.color}
                        />

                        <Text style={styles.targetLabel}>PRACTICE</Text>

                        <Text style={styles.targetMove}>
                            {feedback}
                        </Text>
                        <Text style={styles.targetLabel}>{moveIndex} / {openingData.moves.length} moves played</Text>
                    </View>

                    <View style={styles.masteryContainer}>
                        <Text style={[styles.progressTitle, { color: openingData.color }]}>
                            MASTERY
                        </Text>
                        <View style={{ paddingVertical: 5 }}>
                            <MasteryCircle percent={masteryPercent} color={openingData.color} />
                        </View>
                        <Text style={[styles.progressText, { color: openingData.color }]}>
                            {masteryPercent === 100 ? "Opening Learned" : "Keep Practicing!"}
                        </Text>
                    </View>
                </View>
                <RewardModal visible={isFocused && showReward} onClose={() => setShowReward(false)} />
                <ChessBoard
                    selectedSquare={selectedSquare}
                    legalMoves={legalMoves}
                    playerColor={playerColor}
                    isCheckmate={false}
                    squareInCheck=""
                    getPieceAtSquare={(square) => game.get(square)}
                    onSquarePressIn={handleSquarePress}
                    lastMove={lastMove}
                    illegalSquare={null}

                />

                <View style={styles.controls}>
                    <Pressable style={styles.button} onPress={resetPractice} disabled={saveStatus === "saving"}>
                        <Text style={styles.buttonText}>{saveStatus === "saving" ? "Saving..." : "Reset"}</Text>
                    </Pressable>
                    {saveStatus === "failed" && (
                        <Pressable style={styles.button} onPress={() => void saveOpeningProgress(runRef.current)}>
                            <Text style={styles.buttonText}>Retry save</Text>
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 18,
    },

    targetCard: {
        flex: 1,
        minHeight: 150,
        justifyContent: "center",
        padding: 16,
        borderRadius: 22,
        backgroundColor: "#07342b",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        elevation: 8,
    },

    masteryContainer: {
        flex: 1,
        minHeight: 150,
        alignItems: "center",
        padding: 10,
        borderRadius: 22,
        backgroundColor: "#07342b",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        elevation: 8,
    },

    targetLabel: {
        color: "#FFD95A",
        fontSize: 12,
        fontWeight: "900",
        marginTop: 12,
        marginBottom: 6,
    },

    targetMove: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 21,
        fontWeight: "700",
    },
    progressTitle: {
        fontWeight: "900",
        fontSize: 13,
    },
    progressText: {
        fontWeight: "800",
    },
    headerSubtitle: {
        color: COLORS.text.muted,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    header: {
        height: 120,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerButton: {
        width: 58,
        height: 58,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.05)",

        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",

        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },

    headerCenter: {
        flex: 1,
        alignItems: "center",
    },

    headerTitle: {
        color: COLORS.text.primary,
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 1,
    },

    headerSubtitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },

    masteryTitle: {
        color: "#FFD95A",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 4,
    },

    masteryText: {
        color: "#fff",
        fontSize: 14,
        marginBottom: 12,
    },

    runDot: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#FFD95A",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
    },

    runDotCompleted: {
        backgroundColor: "#FFD95A",
    },

    runDotText: {
        color: "#fff",
        fontWeight: "800",
    },

    masteryPercent: {
        color: "#FFD95A",
        fontWeight: "700",
    },
    container: {
        flex: 1,
        paddingHorizontal: 14,
    },
    controls: {
        gap: 8,
        marginTop: 20,
        alignItems: "center",
    },

    button: {
        backgroundColor: "#FFD95A",
        width: 220,
        height: 62,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FFD95A",
        shadowOpacity: 0.22,
        shadowRadius: 14,
    },

    buttonText: {
        color: "#21130d",
        fontWeight: "700",
        fontSize: 16,
    },
});
