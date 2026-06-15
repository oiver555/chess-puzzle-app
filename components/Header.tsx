import { isNarrowPhone, isSmallPhone } from "@/constants/globals";
import { openings } from "@/data/openings";
import { COLORS } from "@/theme/colors";
import { playSound } from "@/util/chessUtils";
import { SOUNDS } from "@/util/sounds";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";

type HeaderVariant = 1 | 2 | 3;

type AppHeaderProps = {
    variant: HeaderVariant;
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    onSettings: () => void;
    children?: React.ReactNode;
    learnedOpenings?: number;
};

export default function Header({ onSettings, learnedOpenings = 0, variant, subtitle, title, }: AppHeaderProps) {

    const percent = (learnedOpenings / openings.length) * 100;
    const illegalPlayer = useAudioPlayer(SOUNDS.illegal);

    if (variant === 1) {
        return (
            <LinearGradient colors={[COLORS.homepage.dark, COLORS.homepage.dark2]} style={h1.header}>
                <View style={h1.profileRow}>
                    <Image
                        source={require("../assets/images/profile/avatar.png")}
                        style={h1.avatar}
                    />

                    <View style={h1.profileInfo}>
                        <Text numberOfLines={3} adjustsFontSizeToFit style={h1.name}>{title}</Text>

                        <View style={h1.rankRow}>
                            <Ionicons name="book" size={18} color={COLORS.homepage.gold} />
                            <Text style={h1.homerank}>{subtitle}</Text>
                        </View>

                        <View style={h1.progressContainer}>
                            <View style={h1.progressTrack}>
                                <View
                                    style={[
                                        h1.progressFill,
                                        { width: `${percent}%` }
                                    ]}
                                />
                                <View style={h1.progressContent}>

                                    <Text style={h1.progressLabel}>
                                        OPENINGS LEARNED
                                    </Text>

                                    <Text style={h1.progressText}>
                                        {learnedOpenings} / {openings.length}
                                    </Text>

                                </View>
                            </View>
                        </View>
                    </View>

                    <Pressable style={h1.headerIcon}
 
                        onPress={() => {
                             playSound(illegalPlayer)
                            onSettings()
                        }}>
                        <Ionicons name="settings" size={25} color="#EDE7DA" />
                    </Pressable>
                </View>
            </LinearGradient>
        )
    }

    if (variant === 2) {
        return (
            <LinearGradient colors={[COLORS.header.dark, COLORS.header.dark2]} style={h2.header}>
                <Text style={h2.level}>LEVEL</Text>
                <Text style={h2.rank}>{subtitle}</Text>
            </LinearGradient>

        );
    }
    if (variant === 3) {
        return (
            <LinearGradient colors={[COLORS.homepage.dark, COLORS.homepage.dark2]} style={h3.header}>
                <Pressable onPressIn={() => playSound(illegalPlayer)} style={h1.headerButton} onPress={() => router.replace("/")}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </Pressable>

                <Text style={h1.headerTitle}>{title}</Text>

                <Pressable onPress={() => {
                    onSettings()
                }}
                    onPressIn={() => playSound(illegalPlayer)} style={h1.headerButton}>
                    <Ionicons name="settings" size={24} color="#fff" />
                </Pressable>
            </LinearGradient>
        );
    }
}
const h1 = StyleSheet.create({

    header: {
        paddingTop: isSmallPhone ? 30 : 40,
        paddingHorizontal: 22,
        paddingBottom: isSmallPhone ? 14 : 20,
        borderBottomColor: COLORS.homepage.gold,
        borderBottomWidth: 3,
    },

    headerButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
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
    homerank: {
        color: COLORS.homepage.gold,
        fontSize: isNarrowPhone ? 13 : 15,
        fontWeight: "800",
    },
    headerTitle: {
        flex: 1,
        color: "#fff",
        textAlign: "center",
        fontSize: isNarrowPhone ? 24 : 30,
        fontWeight: "900",
        letterSpacing: 1,
    },
    avatar: {
        width: isSmallPhone ? 56 : 64,
        height: isSmallPhone ? 56 : 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: COLORS.homepage.gold,
    },
    name: {
        color: "#fff",
        fontSize: isNarrowPhone ? 16 : 18,
        fontWeight: "900",
    },
    // rank: {
    //     color: COLORS.homepage.gold,
    //     fontSize: isNarrowPhone ? 13 : 15,
    //     fontWeight: "800",
    // },
    progressTrack: {
        height: isSmallPhone ? 20 : 24,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.12)",
        overflow: "hidden",
        justifyContent: "center",
    },


    profileRow: {
        flexDirection: "row",
        alignItems: "center",
    },



    profileInfo: {
        flex: 1,
        marginLeft: 14,
    },



    rankRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 6,
    },



    openings: {
        color: "#fff",
        marginTop: 6,
        fontSize: 14,
    }, progressContainer: {
        marginTop: 14,
    },



    progressFill: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: COLORS.homepage.gold,
        borderRadius: 15,
    },

    progressContent: {
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    progressLabel: {
        color: "#d0d0d0",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },

    progressText: {
        color: "#d0d0d0",
        fontSize: 11,
        fontWeight: "900",
        zIndex: 1,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
    },

});


const h2 = StyleSheet.create({

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
})

const h3 = StyleSheet.create({
    header: {
        paddingTop: isSmallPhone ? 34 : 46,
        paddingBottom: 14,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        borderBottomColor: COLORS.homepage.gold,
        borderBottomWidth: 3,
    },
})