import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";


type HeaderProps = {
    title: string
};

export default function Header({ title }: HeaderProps) {
    return (
        <View style={styles.header}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>♟</Text>
            </View>
            <Text style={styles.title} >{title}</Text>
            <Pressable style={styles.settings}>
                {/* <Text style={styles.settingsText}>⚙</Text> */}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
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
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#fff",
    },

    avatar: {
        width: 62,
        height: 62,
        borderRadius: 31,
        // backgroundColor: "#111",
        // borderWidth: 4,
        // borderColor: "#f5c542",
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
        // backgroundColor: "#b00000",
        alignItems: "center",
        justifyContent: "center",
    },

    settingsText: {
        fontSize: 30,
    },
});