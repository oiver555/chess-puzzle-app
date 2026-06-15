import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image, 
    ScrollView, 
} from "react-native"; 
import { Ionicons, MaterialCommunityIcons,  } from "@expo/vector-icons";
import { router } from "expo-router";
import * as NavigationBar from "expo-navigation-bar"; 
import { getLearnedOpeningsCount, loadAppState } from "@/util/storage";
import { SettingsModal } from "@/components/SettingsModal"; 
import { MenuCard } from "@/components/MenuCard";
import { deviceWidth, isNarrowPhone, isSmallPhone } from "@/constants/globals";
import { COLORS } from "@/theme/colors";
import Header from "@/components/Header";
 

export default function App() {

    const [showSettings, setShowSettings] = React.useState(false);
    const [learnedOpenings, setLearnedOpenings] = React.useState(0);
   
    React.useEffect(() => {
        NavigationBar.setVisibilityAsync("hidden");

        async function load() {
            const count = await getLearnedOpeningsCount();
            setLearnedOpenings(count);
        }

        load();
        return () => {
            NavigationBar.setVisibilityAsync("visible");
        };
    }, []);


    React.useEffect(() => {
        async function restoreLastScreen() {
            const saved = await loadAppState();

            if (saved?.lastRoute === "/Match") {
                console.log("Reload Last Location");
                
                router.replace(saved.lastRoute);
            }
        }

        restoreLastScreen();
    }, []);
    
    return (
        <View style={styles.screen}>
            <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

            <Header location="" title="CHESSMASTER" subtitle="OPENING SCHOLAR" variant={1} onSettings={() => setShowSettings(true)} learnedOpenings={learnedOpenings} />

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
                            <MaterialCommunityIcons name="chess-king" size={22} color={COLORS.homepage.gold} />
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
                        onPress={() => {}}
                    />

                    <MenuCard
                        icon={<Ionicons name="book-outline" size={34} color="#fff" />}
                        title="LEARN OPENINGS"
                        onPress={() => router.push("/LearnOpenings")}
                    />
                </View>
            </ScrollView>
 
        </View>
    );
}
 
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.homepage.cream,
    },
    header: {
        paddingTop: isSmallPhone ? 30 : 40,
        paddingHorizontal: 22,
        paddingBottom: isSmallPhone ? 14 : 20, 
        borderBottomColor: COLORS.homepage.gold,
        borderBottomWidth: 3,
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

    rank: {
        color: COLORS.homepage.gold,
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
        color: COLORS.homepage.text,
        letterSpacing: 1,
    },

    heroImageWrap: {
        width: deviceWidth * 0.48,
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
        backgroundColor: COLORS.homepage.card,
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
        backgroundColor: COLORS.homepage.dark,
        alignItems: "center",
        justifyContent: "center",
    },

    cardTitle: {
        color: COLORS.homepage.text,
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
    }, 
    progressContainer: {
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

    content: {
        flex: 1,
        // marginTop: -22,
    },

    contentInner: {
        paddingBottom: 130,
    },

    boardPattern: {
        ...StyleSheet.absoluteFill,
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
        backgroundColor: COLORS.homepage.gold,
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
        backgroundColor: COLORS.homepage.gold,
    },

    cardText: {
        flex: 1,
        marginLeft: 18,
    },



    cardSubtitle: {
        color: COLORS.homepage.muted,
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
        backgroundColor: COLORS.homepage.dark2,
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
        color: COLORS.homepage.gold,
    },
});