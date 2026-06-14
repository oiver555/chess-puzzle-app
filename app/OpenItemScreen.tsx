import { Footer } from "@/components/Footer";
import Header from "@/components/Header";
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chess } from "chess.js";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import WK from "../assets/pieces/svg/wK.svg";
import WQ from "../assets/pieces/svg/wQ.svg";
import WR from "../assets/pieces/svg/wR.svg";
import WB from "../assets/pieces/svg/wB.svg";
import WN from "../assets/pieces/svg/wN.svg";
import WP from "../assets/pieces/svg/wP.svg";
import BK from "../assets/pieces/svg/bK.svg";
import BQ from "../assets/pieces/svg/bQ.svg";
import BR from "../assets/pieces/svg/bR.svg";
import BB from "../assets/pieces/svg/bB.svg";
import BN from "../assets/pieces/svg/bN.svg";
import BP from "../assets/pieces/svg/bP.svg";
import MasteryCircle from "@/components/MasteryCircle";
import AdBanner from "@/components/AdBanner";
import { Opening, OpeningProgress } from "@/data/openings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/storage";
import { getOpeningProgress } from "@/util/storage";

const { width } = Dimensions.get("window");
type ChessPieceComponent = React.ComponentType<any>;

type BoardPosition = Record<number, ChessPieceComponent>;

type OpeningPosition = {
    label: string;
    move: string | null;
    board: BoardPosition;
};

export default function OpeningDetailScreen() {
    const { opening } = useLocalSearchParams();
    const openingData = JSON.parse(opening as string) as Opening;
    const [moveIndex, setMoveIndex] = React.useState(0);
    const defaultProgress: OpeningProgress = {
        openingId: openingData.name,
        mastery: 0,
        completedReps: 0,
        correctMoves: 0,
        totalAttempts: 0,
        lastPracticedAt: undefined,
    };

    const [masteryPercent, setMasteryPercent] =
        React.useState<number>(defaultProgress.mastery);

    useFocusEffect(() => {
        async function load() {
            const progress = await getOpeningProgress(
                openingData.name
            );

            if (!progress) return;

            setMasteryPercent(progress.mastery);
            // setCompletedReps(progress.completedReps);
        }

        load();

    } );
 
    const pieceMap: Record<string, React.ComponentType<any>> = {
        p: BP,
        r: BR,
        n: BN,
        b: BB,
        q: BQ,
        k: BK,
        P: WP,
        R: WR,
        N: WN,
        B: WB,
        Q: WQ,
        K: WK,
    };

    function fenToBoardPosition(fen: string): BoardPosition {
        const board: BoardPosition = {};
        const rows = fen.split(" ")[0].split("/");

        let index = 0;

        rows.forEach((row) => {
            row.split("").forEach((char) => {
                if (Number.isInteger(Number(char))) {
                    index += Number(char);
                } else {
                    board[index] = pieceMap[char];
                    index++;
                }
            });
        });

        return board;
    }

    function generateOpeningPositions(moves: string[]): OpeningPosition[] {
        const chess = new Chess();

        const positions: OpeningPosition[] = [
            {
                label: "Starting Position",
                move: null,
                board: fenToBoardPosition(chess.fen()),
            },
        ];

        moves.forEach((move, index) => {
            chess.move(move);

            positions.push({
                label: `After ${index + 1}. ${move}`,
                move,
                board: fenToBoardPosition(chess.fen()),
            });
        });

        return positions;
    }


    const openingPositions = generateOpeningPositions(openingData.moves);



    return (
        <SafeAreaView style={styles.screen}>
            <LinearGradient colors={[COLORS.header.dark, COLORS.header.dark2]} style={styles.header}>
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
                    <Text style={styles.headerSubtitle}>
                        OPENING
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.headerTitle}>
                        {openingData.name}
                    </Text>
                </View>

                <Pressable style={styles.headerButton}>
                    <Ionicons
                        name="settings-sharp"
                        size={24}
                        color={COLORS.text.primary}
                    />
                </Pressable>
            </LinearGradient>


            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.card}>
                    <View style={styles.heroRow}>
                        <Text style={styles.description}>
                            {openingData.description}
                        </Text>
                    </View>

                    <View style={styles.statGrid}>
                        <InfoBox label="Ideal for" value={openingData.difficulty} />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>OPENING MOVES</Text>

                    <View style={styles.movesBox}>
                        <ScrollView style={styles.moveList} horizontal showsHorizontalScrollIndicator={false}>
                            {openingData.moveDetails.map((item, index) => (
                                <Move
                                    key={index}
                                    number={item.order}
                                    icon={item.piece}
                                    move={item.move}
                                    text={item.text}
                                />
                            ))}
                        </ScrollView>
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <ChessBoard pieces={openingPositions[moveIndex].board} orientation={openingData.side} />


                            <View style={styles.boardControls}>
                                <Pressable
                                    style={styles.controlButton}
                                    onPress={() => setMoveIndex((prev) => Math.max(prev - 1, 0))}
                                >
                                    <Text style={styles.controlText}>{"<"}</Text>
                                </Pressable>

                                <Text style={styles.moveCounter}>
                                    {moveIndex} / {openingPositions.length - 1}
                                </Text>

                                <Pressable
                                    style={styles.controlButton}
                                    onPress={() =>
                                        setMoveIndex((prev) =>
                                            Math.min(prev + 1, openingPositions.length - 1)
                                        )
                                    }
                                >
                                    <Text style={styles.controlText}>{">"}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>ABOUT THIS OPENING</Text>

                    <Text style={styles.bodyText}>
                        {openingData.commentary}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.learnRow}>
                        <View style={styles.progressBox}>
                            <Text style={[styles.progressTitle, { color: openingData.color, }]}>MASTERY</Text>
                            <MasteryCircle percent={masteryPercent} color={openingData.color} />
                            <Text style={[styles.progressText, { color: openingData.color, }]}>Keep practicing!</Text>
                        </View>
                    </View>
                </View>


                <ActionButton
                    text="PRACTICE"
                    backgroundColor={openingData.color}
                    onPress={() => {
                        router.push({
                            pathname: "/OpeningPractice",
                            params: {
                                opening: JSON.stringify(openingData),
                                masteryPercent,
                            },
                        });
                    }}
                />


            </ScrollView>

            <AdBanner />
        </SafeAreaView>
    );
}

function InfoBox({ label, value, green }: any) {
    return (
        <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, green && { color: "#58e85a" }]}>
                {value}
            </Text>
        </View>
    );
}

function Move({ number, icon, move, text }: any) {
    return (
        <View style={styles.moveItem}>
            <Text style={styles.moveNumber}>{number}</Text>
            <View style={styles.moveContent}>
                <Text style={styles.moveTitle}>
                    <Text style={styles.moveIcon}>{icon}</Text> {move}
                </Text>
                <Text style={styles.moveText}>{text}</Text>
            </View>
        </View>
    );
}

function ChessBoard({
    pieces,
    orientation = "white",
}: {
    pieces: BoardPosition;
    orientation?: "white" | "black";
}) {
    const files =
        orientation === "white"
            ? ["a", "b", "c", "d", "e", "f", "g", "h"]
            : ["h", "g", "f", "e", "d", "c", "b", "a"];

    const ranks =
        orientation === "white"
            ? ["8", "7", "6", "5", "4", "3", "2", "1"]
            : ["1", "2", "3", "4", "5", "6", "7", "8"];
    return (
        <View style={styles.boardOuter}>
            <View style={styles.fileLabels}>
                {files.map((file) => (
                    <Text key={file} style={styles.boardLabel}>{file}</Text>
                ))}
            </View>

            <View style={styles.boardMiddle}>
                <View style={styles.rankLabels}>
                    {ranks.map((rank) => (
                        <Text key={rank} style={styles.rankLabel}>{rank}</Text>
                    ))}
                </View>
                <View style={styles.board}>
                    {(orientation === "white"
                        ? [...Array(64).keys()]
                        : [...Array(64).keys()].reverse()
                    ).map((boardIndex, renderIndex) => {

                        const row = Math.floor(renderIndex / 8);
                        const col = renderIndex % 8;
                        const dark = (row + col) % 2 === 1;
                        const Piece = pieces[boardIndex];
                        return (
                            <View
                                key={boardIndex}
                                style={[
                                    styles.square,
                                    {
                                        backgroundColor: dark
                                            ? "#6b9651"
                                            : "#f1edc9",
                                    },
                                ]}
                            >
                                {Piece && (
                                    <Piece
                                        width={32}
                                        height={32}
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

function ActionButton({
    text,
    backgroundColor,
    onPress,
}: {
    text: string;
    backgroundColor: string;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.practiceButton,
                {
                    backgroundColor,
                    shadowColor: backgroundColor,
                },
            ]}
        >
            {/* <View style={styles.practiceIconCircle}>
                <Ionicons
                    name="play"
                    size={28}
                    color={COLORS.background}
                />
            </View> */}

            <Text style={styles.practiceButtonText}>
                {text}
            </Text>
        </Pressable>
    );
}



const styles = StyleSheet.create({

    headerButton: {
        width: 50,
        height: 50,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        backgroundColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 14,
    },
    headerTitle: {
        color: COLORS.text.primary,
        fontSize: 28,
        lineHeight: 28,
        fontWeight: "900",
        letterSpacing: 0.5,
        textAlign: "center"
    },

    headerSubtitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },

    headerDot: {
        width: 8,
        height: 8,
        borderRadius: 999,

        backgroundColor: COLORS.board.border,

        marginRight: 8,
    },

    headerSubtitle: {
        color: COLORS.text.muted,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    boardControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 12,
    },
    controlButton: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },

    controlText: {
        color: COLORS.board.border,
        fontSize: 16,
        fontWeight: "900",
    },

    moveCounter: {
        color: COLORS.board.border,
        fontSize: 15,
        fontWeight: "900",
    },
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    header: {
        height: 150,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        borderBottomWidth: 3,
        borderBottomColor: COLORS.board.border,
    },

    backButton: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 4,
        borderColor: "#ffc845",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
    },

    backText: {
        color: "#fff",
        fontSize: 40,
        fontWeight: "700",
    },

    titleWrap: {
        alignItems: "center",
    },

    king: {
        color: "#ffc845",
        fontSize: 34,
    },

    title: {
        color: "#fff",
        fontSize: 31,
        fontWeight: "900",
        letterSpacing: 1,
    },

    eco: {
        color: "#ffc845",
        fontSize: 20,
        fontWeight: "800",
        marginTop: 4,
    },

    settings: {
        width: 70,
        height: 70,
        borderRadius: 14,
        backgroundColor: "#d00000",
        alignItems: "center",
        justifyContent: "center",
    },

    settingsText: {
        fontSize: 34,
    },

    tabs: {
        height: 70,
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#135f65",
    },

    tabItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    tabText: {
        color: "#a7abad",
        fontSize: 18,
        fontWeight: "800",
    },

    activeTab: {
        color: "#ffc845",
    },

    tabUnderline: {
        position: "absolute",
        bottom: 0,
        height: 4,
        width: "80%",
        backgroundColor: "#ffc845",
        borderRadius: 10,
    },

    content: {
        padding: 18,
        paddingBottom: 50,
    },

    card: {
        backgroundColor: "rgba(255,255,255,0.045)",
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        padding: 18,
        marginBottom: 18,
    },

    heroRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 26,
    },

    pawnCircle: {
        width: 155,
        height: 155,
        borderRadius: 80,
        borderWidth: 4,
        borderColor: "#ffc845",
        alignItems: "center",
        justifyContent: "center",
    },

    pawn: {
        color: "#ffc845",
        fontSize: 78,
    },
    description: {
        flex: 1,
        color: COLORS.text.primary,
        fontSize: 20,
        lineHeight: 31,
        fontWeight: "800",
    },
    statGrid: {
        flexDirection: "row",
        gap: 12,
        marginTop: 20,
    },

    infoBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: "rgba(217,180,107,0.45)",
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: "center",
        backgroundColor: "rgba(5,46,46,0.55)",
    },

    infoLabel: {
        color: "rgba(248,241,228,0.72)",
        fontSize: 16,
    },

    infoValue: {
        color: COLORS.board.border,
        fontSize: 20,
        fontWeight: "900",
    },

    sectionTitle: {
        color: COLORS.text.primary,
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 18,
    },

    movesBox: {
        flexDirection: "column",
        borderWidth: 1.5,
        borderColor: "rgba(217,180,107,0.55)",
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "rgba(5,46,46,0.35)",
    },

    moveList: {
        flexDirection: "row",
    },

    moveItem: {
        width: 210,
        flexDirection: "row",
        gap: 10,
        padding: 16,
        borderRightColor: "rgba(217,180,107,0.35)",
        borderRightWidth: 1,
        borderBottomColor: "rgba(217,180,107,0.35)",
        borderBottomWidth: 1,
    },

    moveContent: {
        flex: 1,
        minWidth: 0,
    },

    moveNumber: {
        color: "rgba(248,241,228,0.72)",
        fontSize: 22,
        flexShrink: 0,
    },

    moveText: {
        color: "rgba(248,241,228,0.72)",
        fontSize: 16,
        lineHeight: 23,
        marginTop: 10,
    },

    moveTitle: {
        color: COLORS.text.primary,
        fontSize: 22,
        fontWeight: "900",
    },

    moveIcon: {
        fontSize: 22,
    },

    boardOuter: {
        alignItems: "center",
        margin: 16,
        // borderWidth: 1.5,
        // borderColor: COLORS.board.border,
        borderRadius: 18,
        padding: 12,
    },

    fileLabels: {
        width: width * 0.72,
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 4,
    },

    boardMiddle: {
        flexDirection: "row",
        alignItems: "center",
    },

    rankLabels: {
        height: width * 0.72,
        justifyContent: "space-around",
        marginRight: 6,
    },


    boardLabel: {
        color: COLORS.board.border,
        fontSize: 14,
        fontWeight: "900",
    },

    rankLabel: {
        color: COLORS.board.border,
        fontSize: 14,
        fontWeight: "900",
    },

    board: {
        width: width * 0.72,
        aspectRatio: 1,
        flexDirection: "row",
        flexWrap: "wrap",
    },


    square: {
        width: "12.5%",
        height: "12.5%",
        alignItems: "center",
        justifyContent: "center",
    },

    piece: {
        fontSize: 25,
        color: "#111",
    },

    bodyText: {
        color: "#e5e5e5",
        fontSize: 17,
        lineHeight: 23,
    },

    divider: {
        height: 1,
        backgroundColor: "#14717a",
        marginVertical: 16,
    },

    learnRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
    },

    checkItem: {
        color: "#e6e6e6",
        fontSize: 15,
        marginBottom: 9,
    },

    progressBox: {
        width: 165,
        borderWidth: 2,
        borderColor: COLORS.board.border,
        borderRadius: 16,
        alignItems: "center",
        padding: 12,
        gap: 10
    },

    progressTitle: {
        fontWeight: "900",
        fontSize: 13,
    },

    progressCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 8,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 12,
    },

    progressPercent: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
    },

    progressText: {
        fontWeight: "800",
    },

    practiceButton: {
        height: 86,
        borderRadius: 24,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

        gap: 18,

        marginTop: 10,
        marginBottom: 10,

        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.18)",

        shadowOpacity: 0.45,
        shadowRadius: 16,
        shadowOffset: {
            width: 0,
            height: 6,
        },

        elevation: 10,
    },

    practiceIconCircle: {
        width: 54,
        height: 54,
        borderRadius: 999,

        backgroundColor: "rgba(5,46,46,0.95)",

        alignItems: "center",
        justifyContent: "center",
    },

    practiceButtonText: {
        color: COLORS.background,
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 1.5,
    },

    bottomNav: {
        position: "absolute",
        bottom: 0,
        height: 92,
        width: "100%",
        backgroundColor: "#7b2f12",
        borderTopWidth: 4,
        borderTopColor: "#ffc845",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },

    navItem: {
        alignItems: "center",
    },

    navIcon: {
        color: "#ccc",
        fontSize: 28,
    },

    navLabel: {
        color: "#ccc",
        fontSize: 16,
        marginTop: 4,
    },

    navActive: {
        color: "#ffc845",
        fontWeight: "900",
    },
});