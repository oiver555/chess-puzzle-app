import { StyleSheet, View } from "react-native";

export const Footer = () => (

    <View style={styles.footer}>

        <View style={styles.footerItems}>

        </View>
    </View>
) 

const styles = StyleSheet.create({ 
 
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
