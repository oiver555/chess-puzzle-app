import React, { useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEcoCategory } from "@/util/chessUtils";
import { COLORS } from "@/theme/colors";
import AdBanner from "@/components/AdBanner";
import { LinearGradient } from "expo-linear-gradient";
import { OpeningProgress, openings } from "@/data/openings";
import MasteryCircle from "@/components/MasteryCircle";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants/storage";



export default function LearnOpeningsScreen() {
    const router = useRouter();
    const [progressByOpening, setProgressByOpening] =
        React.useState<Record<string, OpeningProgress>>({});


    useFocusEffect(
        useCallback(() => {
            async function loadProgress() {
                const saved = await AsyncStorage.getItem(
                    STORAGE_KEYS.OPENING_PROGRESS
                );

                const allProgress: Record<string, OpeningProgress> = saved
                    ? JSON.parse(saved)
                    : {};

                setProgressByOpening(allProgress);
            }

            loadProgress();
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
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
                    <Text style={styles.headerTitle}>Openings</Text>

                    <View style={styles.headerSubtitleRow}>

                        <Text style={styles.headerSubtitle}>
                            Learn them all!
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
            </LinearGradient>

            <FlatList
                data={openings}
                keyExtractor={(item) => item.eco}
                contentContainerStyle={styles.content}
                renderItem={({ item: opening }) => {
                    const openingId = opening.name;
                    const progress = progressByOpening[openingId];
                    const mastery = progress?.mastery ?? 0;
                    return (<Pressable
                        style={styles.card}
                        onPress={() => {
                            router.push({
                                pathname: "/OpenItemScreen",
                                params: {
                                    opening: JSON.stringify(opening),
                                },
                            });
                        }}
                    >
                        <View style={styles.openingColumn}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                                <View style={[styles.iconCircle, { borderColor: opening.color }]}>
                                    <MaterialCommunityIcons
                                        name={opening.icon as any}
                                        size={24}
                                        color={opening.color}
                                    />

                                </View>
                                <Text style={styles.openingName}>{opening.name}</Text>
                            </View>


                            <View style={styles.cardText}>


                                <Text style={[styles.eco, { color: opening.color }]}>
                                    ECO: {opening.eco}
                                </Text>

                                <Text numberOfLines={2} style={styles.commentary}>
                                    {opening.commentary}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.masteryBox}>
                            <MasteryCircle fontSize={15} percent={mastery} color={opening.color} size={60} strokeWidth={5} />

                            <Text style={[styles.masteryLabel, { color: opening.color }]}>
                                Mastery
                            </Text>
                        </View>
                    </Pressable>)
                }}
                ListHeaderComponent={
                    <>
                        <View style={styles.searchRow}>
                            <View style={styles.searchBox}>
                                <Ionicons
                                    name="search"
                                    size={26}
                                    color="#A8B8B8"
                                />

                                <TextInput
                                    placeholder="Search..."
                                    placeholderTextColor="#A8B8B8"
                                    style={styles.searchInput}
                                />
                            </View>

                            <Pressable style={styles.filterButton}>
                                <Ionicons
                                    name="options"
                                    size={24}
                                    color="#fff"
                                />

                                <Text style={styles.filterText}>
                                    Filter
                                </Text>
                            </Pressable>
                        </View>
                    </>
                }
                ListFooterComponent={
                    <View style={styles.startCard}>
                        <MaterialCommunityIcons
                            name="book-open-page-variant"
                            size={38}
                            color="#FFD95A"
                        />

                        <View style={{ flex: 1 }}>
                            <Text style={styles.startTitle}>
                                Not sure where to start?
                            </Text>

                            <Text style={styles.startText}>
                                Try the recommended learning path.
                            </Text>
                        </View>

                        <Pressable style={styles.startButton}>
                            <Text style={styles.startButtonText}>
                                Start Path
                            </Text>

                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#000"
                            />
                        </Pressable>
                    </View>
                }
            />
            <AdBanner />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 120,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        backgroundColor: COLORS.background,

        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.board.border,
    },

    headerButton: {
        width: 54,
        height: 54,
        borderRadius: 18,

        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",

        backgroundColor: "rgba(255,255,255,0.05)",

        alignItems: "center",
        justifyContent: "center",
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
    card: {
        minHeight: 132,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        backgroundColor: "rgba(255,255,255,0.045)",
        marginBottom: 14,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    openingColumn: {
        flex: 1,
    },

    iconCircle: {
        width: 43,
        height: 43,
        borderRadius: 43,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    cardText: {
        flexShrink: 1,
    },

    masteryBox: {
        width: 90,
        alignItems: "center",
        alignSelf: "flex-end",
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 14,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },



    circleButton: {
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
    },


    title: {
        color: COLORS.text.primary,
        fontSize: 36,
        fontWeight: "900",
        letterSpacing: 1,
    },


    subtitle: {
        color: COLORS.text.muted,
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 6,
        letterSpacing: 1,
    },
    settingsButton: {
        width: 64,
        height: 64,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },

    searchRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },

    searchBox: {
        flex: 1,
        height: 64,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        backgroundColor: "rgba(255,255,255,0.05)",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },

    searchInput: {
        flex: 1,
        color: COLORS.text.primary,
        fontSize: 18,
        marginLeft: 10,
    },

    filterButton: {
        height: 64,
        paddingHorizontal: 18,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        backgroundColor: "rgba(255,255,255,0.05)",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    filterText: {
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: "800",
    },
    openingName: {
        color: COLORS.text.primary,
        fontSize: 22,
        fontWeight: "900",
        // marginBottom: 4,
        alignSelf: "flex-start",
    },

    eco: {
        color: COLORS.text.muted,
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 6,
    },

    commentary: {
        color: "rgba(248,241,228,0.75)",
        fontSize: 15,
        lineHeight: 20,
    },



    masteryCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 5,
        alignItems: "center",
        justifyContent: "center",
    },

    masteryText: {
        color: COLORS.text.primary,
        fontWeight: "900",
        fontSize: 16,
    },

    masteryLabel: {
        color: COLORS.text.muted,
        marginTop: 6,
        fontSize: 12,
        fontWeight: "900",
    },

    startCard: {
        marginTop: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.board.border,
        backgroundColor: "rgba(255,255,255,0.045)",
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    startTitle: {
        color: COLORS.text.primary,
        fontSize: 19,
        fontWeight: "900",
    },
    startText: {
        color: "rgba(248,241,228,0.75)",
        fontSize: 14,
        marginTop: 4,
    },

    startButton: {
        backgroundColor: COLORS.board.border,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
    },

    startButtonText: {
        color: COLORS.background,
        fontWeight: "900",
        fontSize: 15,
    },
});