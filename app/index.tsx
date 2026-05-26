import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    Pressable,
    ScrollView,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";

const { width, height } = Dimensions.get("window");

const isSmallPhone = height < 700;
const isNarrowPhone = width < 380;

const scale = (size: number) => {
    const baseWidth = 390;
    return Math.round((width / baseWidth) * size);
};

const COLORS = {
    dark: "#062E26",
    dark2: "#031D19",
    cream: "#F8F2E6",
    card: "#FFFDF8",
    gold: "#D5A94A",
    text: "#07352D",
    muted: "#385A52",
};

export default function App() {


    useEffect(() => {
        NavigationBar.setVisibilityAsync("hidden");

        return () => {
            NavigationBar.setVisibilityAsync("visible");
        };
    }, []); 
    return (
        <View style={styles.screen}>
            <LinearGradient colors={[COLORS.dark, COLORS.dark2]} style={styles.header}>
                <View style={styles.profileRow}>
                    <Image
                        source={require("../assets/images/profile/avatar.png")}
                        style={styles.avatar}
                    />

                    <View style={styles.profileInfo}>
                        <Text numberOfLines={3} adjustsFontSizeToFit style={styles.name}>CHESSMASTER</Text>

                        <View style={styles.rankRow}>
                            <Ionicons name="book" size={18} color={COLORS.gold} />
                            <Text style={styles.rank}>OPENING SCHOLAR</Text>
                        </View>


                        <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: "42%" }]} />

                                <View style={styles.progressContent}>
                                    <Text style={styles.progressLabel}>
                                        OPENINGS LEARNED
                                    </Text>

                                    <Text style={styles.progressText}>
                                        42 / 100
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>



                    <Pressable style={styles.headerIcon}>
                        <Ionicons name="settings" size={25} color="#EDE7DA" />
                    </Pressable>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require("../assets/images/home/board-pattern.png")}
                    style={styles.boardPattern}
                    resizeMode="cover"
                />

                <View style={styles.heroSection}>
                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>CHOOSE{"\n"}YOUR MODE</Text>
                        <View style={styles.goldLineRow}>
                            <MaterialCommunityIcons name="chess-king" size={22} color={COLORS.gold} />
                            <View style={styles.goldLine} />
                        </View>
                    </View>

                    <View style={styles.heroImageWrap}>
                        <Image
                            source={require("../assets/images/home/chess-hero.png")}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />

                        <Image
                            source={require("../assets/images/home/chess-hero.png")}
                            style={styles.heroReflection}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View style={styles.menu}>
                    <MenuCard
                        icon={<MaterialCommunityIcons name="chess-king" size={34} color="#fff" />}
                        title="PLAY VS COMPUTER"
                        onPress={() => router.push("/ComputerSettings")}
                    />

                    <MenuCard
                        icon={<MaterialCommunityIcons name="puzzle" size={34} color="#fff" />}
                        title="PUZZLES"
                        gold
                    />

                    <MenuCard
                        icon={<Ionicons name="book-outline" size={34} color="#fff" />}
                        title="LEARN OPENINGS"
                        onPress={() => router.push("/LearnOpenings")}
                    />
                </View>
            </ScrollView>

            {/* <BottomNav /> */}
        </View>
    );
}
function MenuCard({
    icon,
    title,
    gold = false,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    gold?: boolean;
    onPress?: () => void;
}) {
    return (
        <Pressable onPress={onPress} style={styles.card}>
            <View style={[styles.cardIcon, gold && styles.cardIconGold]}>{icon}</View>

            <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={32} color={COLORS.text} />
        </Pressable>
    );
}

function BottomNav() {
    return (
        <View style={styles.bottomNav}>
            <NavItem icon="home" label="HOME" active />
            <NavItem icon="navigate-circle-outline" label="MISSIONS" />
            <NavItem icon="horse-variant" label="COLLECTION" material />
            <NavItem icon="person" label="PROFILE" />
        </View>
    );
}

function NavItem({
    icon,
    label,
    active = false,
    material = false,
}: {
    icon: any;
    label: string;
    active?: boolean;
    material?: boolean;
}) {
    const color = active ? COLORS.gold : "#C9C9C9";

    return (
        <Pressable style={styles.navItem}>
            {material ? (
                <MaterialCommunityIcons name={icon} size={30} color={color} />
            ) : (
                <Ionicons name={icon} size={30} color={color} />
            )}
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.cream,
    },
    header: {
        paddingTop: isSmallPhone ? 30 : 40,
        paddingHorizontal: 22,
        paddingBottom: isSmallPhone ? 14 : 20,
        
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 3,
    },

    avatar: {
        width: isSmallPhone ? 56 : 64,
        height: isSmallPhone ? 56 : 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: COLORS.gold,
    },

    name: {
        color: "#fff",
        fontSize: isNarrowPhone ? 16 : 18,
        fontWeight: "900",
    },

    rank: {
        color: COLORS.gold,
        fontSize: isNarrowPhone ? 13 : 15,
        fontWeight: "800",
    },

    progressTrack: {
        height: isSmallPhone ? 20 : 24,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.12)",
        overflow: "hidden",
        justifyContent: "center",
    },

    heroSection: {
        height: isSmallPhone ? 340 : 430,
        paddingHorizontal: isNarrowPhone ? 20 : 28,
        flexDirection: "row",
        alignItems: "center",
    },

    title: {
        fontSize: isNarrowPhone ? 28 : 34,
        lineHeight: isNarrowPhone ? 34 : 40,
        fontWeight: "900",
        color: COLORS.text,
        letterSpacing: 1,
    },

    heroImageWrap: {
        width: width * 0.48,
        height: isSmallPhone ? 250 : 320,
        alignItems: "center",
        justifyContent: "center",
    },

    menu: {
        paddingHorizontal: isNarrowPhone ? 16 : 22,
        marginTop: isSmallPhone ? -50 : -70,
        gap: isSmallPhone ? 12 : 18,
    },

    card: {
        minHeight: isSmallPhone ? 84 : 104,
        borderRadius: 26,
        backgroundColor: COLORS.card,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,

        // iOS shadow
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: {
            width: 0,
            height: 10,
        },

        // Android shadow
        elevation: 10,

        // subtle border highlight
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.65)",

        // spacing
        marginBottom: 2,
    },

    cardIcon: {
        width: isSmallPhone ? 56 : 68,
        height: isSmallPhone ? 56 : 68,
        borderRadius: 18,
        backgroundColor: COLORS.dark,
        alignItems: "center",
        justifyContent: "center",
    },

    cardTitle: {
        color: COLORS.text,
        fontSize: isNarrowPhone ? 18 : 22,
        fontWeight: "900",
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
        backgroundColor: COLORS.gold,
        borderRadius: 14,
    },

    progressContent: {
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    progressLabel: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },

    progressText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "900",
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

    content: {
        flex: 1,
        // marginTop: -22,
    },

    contentInner: {
        paddingBottom: 130,
    },

    boardPattern: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: 430,
        opacity: 0.55,
    },



    titleBlock: {
        flex: 1,
        zIndex: 2,
    },


    goldLineRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 18,
    },

    goldLine: {
        height: 2,
        width: 90,
        backgroundColor: COLORS.gold,
        marginLeft: 10,
    },



    heroImage: {
        width: "92%",
        height: "100%",
        zIndex: 2,
    },

    heroReflection: {
        position: "absolute",
        width: "115%",
        height: "70%",
        bottom: -140,
        opacity: 0.1,
        transform: [{ scaleY: -1 }],
    },





    cardIconGold: {
        backgroundColor: COLORS.gold,
    },

    cardText: {
        flex: 1,
        marginLeft: 18,
    },



    cardSubtitle: {
        color: COLORS.muted,
        fontSize: 16,
        marginTop: 5,
    },

    bottomNav: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
        height: 92,
        borderRadius: 28,
        backgroundColor: COLORS.dark2,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },

    navItem: {
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },

    navLabel: {
        color: "#C9C9C9",
        fontSize: 12,
        fontWeight: "700",
    },

    navLabelActive: {
        color: COLORS.gold,
    },
});