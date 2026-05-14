import { router } from "expo-router";
import React from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const App = () => {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screen}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>♟</Text>
                    </View>

                    <Pressable style={styles.settings}>
                        <Text style={styles.settingsText}>⚙</Text>
                    </Pressable>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    <View style={styles.logoArea}>
                        <Text style={styles.logo}>♛ ♚</Text>
                    </View>

                    <Text style={styles.title}>CHOOSE YOUR MODE</Text>
                    <MenuButton color="#25c900" label="PLAY VS COMPUTER" route="/computerSettings" />
                    <MenuButton color="#00bcd4" label="PUZZLES" />
                    <MenuButton color="#00d5c7" label="LEARN CHESS" />
                </View>

                {/* Footer */}
                <View style={styles.footer}> 

                    <View style={styles.footerItems}>
                        
                    </View>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const MenuButton = ({ color, route, label }: any) => (
    <Pressable onPress={() => router.push(route)} style={[styles.menuButton, { backgroundColor: color }]}>         
        <Text style={styles.menuText}>{label}</Text>
    </Pressable>
);

const FooterItem = ({ icon, label }: any) => (
    <View style={styles.footerItem}>
        <View style={styles.footerIcon}>
            <Text style={{ fontSize: 28 }}>{icon}</Text>
        </View>
        <Text style={styles.footerLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#06282d",
    },

    header: {
        height: 95,
        backgroundColor: "#7a330f",
        borderBottomWidth: 4,
        borderBottomColor: "#f5c542",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
    },

    avatar: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: "#111",
        borderWidth: 4,
        borderColor: "#f5c542",
        alignItems: "center",
        justifyContent: "center",
    },

    avatarText: {
        color: "#fff",
        fontSize: 30,
    },

    settings: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#b00000",
        alignItems: "center",
        justifyContent: "center",
    },

    settingsText: {
        fontSize: 30,
    },

    body: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        backgroundColor: "#073238",
    },

    logoArea: {
        marginBottom: 20,
    },

    logo: {
        fontSize: 72,
        color: "#f7d56b",
    },

    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 28,
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },

    menuButton: {
        width: "100%",
        height: 72,
        borderRadius: 12,
        marginBottom: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        borderBottomWidth: 6,
        borderBottomColor: "#022",
    },

    menuIcon: {
        fontSize: 32,
        width: 60,
    },

    menuText: {
        flex: 1,
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 2,
    },

    footer: {
        height: 50,
        backgroundColor: "#7a330f",
        borderTopWidth: 4,
        borderTopColor: "#f5c542",
        paddingTop: 12,
    },

    footerTitle: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "900",
        fontSize: 20,
        marginBottom: 12,
    },

    footerItems: {
        flexDirection: "row",
        justifyContent: "space-around",
    },

    footerItem: {
        alignItems: "center",
    },

    footerIcon: {
        width: 58,
        height: 58,
        borderRadius: 10,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
    },

    footerLabel: {
        color: "#fff",
        fontWeight: "800",
        marginTop: 5,
    },
});

export default App;