import { isNarrowPhone, isSmallPhone } from "@/constants/globals";
import { COLORS } from "@/theme/colors";
import { playSound } from "@/util/chessUtils";
import { SOUNDS } from "@/util/sounds";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function MenuCard({
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

    const illegalPlayer = useAudioPlayer(SOUNDS.illegal);


    return (
        <Pressable
            onPressIn={() => playSound(illegalPlayer)}
            onPress={onPress} style={styles.card}>
            <View style={[styles.cardIcon, gold && styles.cardIconGold]}>{icon}</View>

            <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>

            <Ionicons name="chevron-forward" size={32} color={COLORS.homepage.text} />
        </Pressable>
    );
}



const styles = StyleSheet.create({
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
});