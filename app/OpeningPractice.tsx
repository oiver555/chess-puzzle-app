import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/storage";

export type MoveDetail = {
    order: string;
    move: string;
    side: "white" | "black";
    piece: string;
    text?: string;
    commentary?: string;
};

const REQUIRED_RUNS = 5;

export default function OpeningPractice() {
    const { opening, masteryPercent: initialMasteryPercent } = useLocalSearchParams();
    const openingData = JSON.parse(opening as string) as Opening;
    const playerColor = openingData.side === "black" ? "b" : "w";
    const [showReward, setShowReward] = useState(false);
    const [game, setGame] = useState(new Chess());
    const [moveIndex, setMoveIndex] = useState(0);
    const [message, setMessage] = useState(
        `Practice the ${openingData.name}`
    );
    const [lastMove, setLastMove] = useState<LastMove>(null);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [legalMoves, setLegalMoves] = useState<Square[]>([]);
    const [completedReps, setCompletedReps] = useState(0);
    const [masteryPercent, setMasteryPercent] = useState(Number(initialMasteryPercent ?? 0));

    const currentMove = openingData.moves[moveIndex];

    function completeOpeningPractice(progress: OpeningProgress) {
        const completedReps = Math.min(progress.completedReps + 1, REQUIRED_RUNS);

        return {
            ...progress,
            completedReps,
            mastered: completedReps >= REQUIRED_RUNS,
        };
    }
    const handleSquarePress = (squareName: Square) => {
        const piece = game.get(squareName);

        if (selectedSquare && legalMoves.includes(squareName)) {
            handleMove(selectedSquare, squareName);

            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        if (piece && piece.color === playerColor) {
            setSelectedSquare(squareName);

            const moves = game.moves({
                square: squareName,
                verbose: true,
            });

            setLegalMoves(moves.map((move) => move.to as Square));
        } else {
            setSelectedSquare(null);
            setLegalMoves([]);
        }
    };

    const handleMove = (from: Square, to: Square) => {
        const testGame = new Chess(game.fen());

        const move = testGame.move({
            from,
            to,
            promotion: "q",
        });

        if (!move) {
            setMessage("Illegal move.");
            return;
        }

        // Check against expected opening move
        if (move.san !== currentMove) {
            setMessage(`That's not the move. Try ${currentMove}.`);
            return;
        }

        const updatedGame = new Chess(game.fen());

        // Player move
        updatedGame.move({
            from,
            to,
            promotion: "q",
        });
        setGame(updatedGame);
        setLastMove({ from, to });

        const nextIndex = moveIndex + 1;

        // Scripted computer response
        if (openingData.moves[nextIndex]) {

            setMessage("Correct!");

            setTimeout(() => {
                const aiGame = new Chess(updatedGame.fen());
                const aiMove = aiGame.move(openingData.moves[nextIndex]);

                if (aiMove) {
                    setGame(aiGame);
                    setLastMove({
                        from: aiMove.from as Square,
                        to: aiMove.to as Square,
                    });
                    setMoveIndex(nextIndex + 1);
                }
            }, 500);

            return;



        } else {
            setMoveIndex(nextIndex);
            saveOpeningProgress();
            setCompletedReps((prev) => {
                const next = Math.min(prev + 1, REQUIRED_RUNS);

                if (next >= REQUIRED_RUNS) {
                    setShowReward(true);
                }

                return next;
            });
            setMessage("Opening complete!");
        }

        setGame(updatedGame);

    };

    const resetPractice = () => {
        const resetGame = new Chess();

        if (openingData.side === "black") {
            // White starts first
            resetGame.move(openingData.moves[0]);

            setMoveIndex(1);

            setMessage(`Practice the ${openingData.name} as Black`);
        } else {
            setMoveIndex(0);

            setMessage(`Practice the ${openingData.name}`);
        }

        setGame(resetGame);

        setSelectedSquare(null);
        setLegalMoves([]);
        setLastMove(null);
    };

    const formatMove = (move: string) => {
        if (!move) return "Complete";

        const pieceMap: Record<string, string> = {
            K: "King",
            Q: "Queen",
            R: "Rook",
            B: "Bishop",
            N: "Knight",
        };

        const firstChar = move.charAt(0);

        // Pawn move
        if (!pieceMap[firstChar]) {
            return `Pawn to ${move}`;
        }

        const square = move.slice(1);

        return `${pieceMap[firstChar]} to ${square}`;
    };

    async function saveOpeningProgress() {
        const openingId = openingData.name;

        const saved = await AsyncStorage.getItem(
            STORAGE_KEYS.OPENING_PROGRESS
        );

        const allProgress: Record<string, OpeningProgress> = saved
            ? JSON.parse(saved)
            : {};

        const previous = allProgress[openingId] ?? {
            openingId,
            mastery: 0,
            completedReps: 0,
            correctMoves: 0,
            totalAttempts: 0,
            lastPracticedAt: undefined,
        };

        const nextMastery = Math.min(previous.mastery + 20, 100);

        allProgress[openingId] = {
            ...previous,
            mastery: nextMastery,
            completedReps: previous.completedReps + 1,
            correctMoves: previous.correctMoves + openingData.moves.length,
            totalAttempts: previous.totalAttempts + openingData.moves.length,
            lastPracticedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
            STORAGE_KEYS.OPENING_PROGRESS,
            JSON.stringify(allProgress)
        );

        setMasteryPercent(nextMastery);
    }
    console.log(masteryPercent);

    useEffect(() => {
        if (openingData.side === "black") {
            const initialGame = new Chess();

            // White makes the first move
            initialGame.move(openingData.moves[0]);

            setGame(initialGame);

            // User now responds as Black
            setMoveIndex(1);

            setMessage(`Practice the ${openingData.name} as Black`);
        }

    }, []);


    return (
        <LinearGradient style={{ flex: 1 }} colors={[COLORS.header.dark, COLORS.header.dark2]} >
            <SafeAreaView style={styles.container} >

                <View style={styles.header}>
                    <Pressable
                        style={styles.headerButton}
                        onPress={() => router.back()}
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

                        <Text style={styles.targetLabel}>TARGET MOVE</Text>

                        <Text style={styles.targetMove}>
                            {currentMove ? formatMove(currentMove) : "Complete"}
                        </Text>
                    </View>

                    <View style={styles.masteryContainer}>
                        <Text style={[styles.progressTitle, { color: openingData.color }]}>
                            MASTERY
                        </Text>
                        <View style={{ paddingVertical: 5 }}>
                            <MasteryCircle percent={masteryPercent} color={openingData.color} />
                        </View>
                        <Text style={[styles.progressText, { color: openingData.color }]}>
                            Keep practicing!
                        </Text>
                    </View>
                </View>
                <RewardModal visible={showReward} onClose={() => setShowReward(false)} />
                <ChessBoard
                    selectedSquare={selectedSquare}
                    legalMoves={legalMoves}
                    playerColor={playerColor}
                    isCheckmate={false}
                    squareInCheck=""
                    getPieceAtSquare={(square) => game.get(square)}
                    onSquarePress={handleSquarePress}
                    lastMove={lastMove}
                    illegalSquare={null}
                    onSquarePressIn={() => { }}
                />

                <View style={styles.controls}>
                    <Pressable style={styles.button} onPress={resetPractice}>
                        <Text style={styles.buttonText}>Reset</Text>
                    </Pressable>
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
        fontSize: 22,
        fontWeight: "900",
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