import React, { useEffect, useRef, useState } from "react";
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    Dimensions,
    Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ConfettiLayer } from "./ConfettiLayer";

type RewardModalProps = {
    visible: boolean;
    onClose: () => void;
};



export default function RewardModal({ visible, onClose }: RewardModalProps) {


    const dropAnim = useRef(new Animated.Value(-500)).current;

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (visible) {
            setShowModal(true);

            dropAnim.setValue(-1000);

            Animated.spring(dropAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(dropAnim, {
                toValue: 1000,
                duration: 250,
                useNativeDriver: true,
            }).start(() => {
                setShowModal(false);
            });
        }
    }, [visible]);


    return (
        <Modal transparent visible={showModal} animationType="none">
            <View style={styles.overlay}>
                <ConfettiLayer active={visible} />

                <Animated.View style={[
                    styles.card,
                    {
                        transform: [{ translateY: dropAnim }],
                    },
                ]}>
                    <View style={styles.innerBorder} />
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>×</Text>
                    </Pressable>

                    <Text style={styles.trophy}>🏆</Text>

                    <Text style={styles.title}>OPENING COMPLETE!</Text>
                    <Text style={styles.subtitle}>
                        Great job! You’ve mastered this opening.
                    </Text>

                    <View style={styles.dividerRow}>
                        <View style={styles.line} />
                        <Text style={styles.earned}>YOU EARNED</Text>
                        <View style={styles.line} />
                    </View>

                    {/* <View style={styles.rewardsRow}>
                            <RewardCard icon="⭐" value="+100" label="XP" />
                            <RewardCard icon="🪙" value="+25" label="Coins" />
                            <RewardCard icon="♗" value="London" label="Badge Unlocked!" />
                        </View>
                     */}

                    <Pressable style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>AWESOME!</Text>
                    </Pressable>
                </Animated.View>

            </View>

        </Modal>
    );
}

function RewardCard({
    icon,
    value,
    label,
}: {
    icon: string;
    value: string;
    label: string;
}) {
    return (
        <View style={styles.rewardCard}>
            <Text style={styles.rewardIcon}>{icon}</Text>
            <Text style={styles.rewardValue}>{value}</Text>
            <Text style={styles.rewardLabel}>{label}</Text>
        </View>
    );
}


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(2, 6, 12, 0.86)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    card: {
        width: "100%",
        maxWidth: 420,
        borderRadius: 30,
        backgroundColor: "rgba(9, 17, 29, 1)",
        borderWidth: 3,
        borderColor: "#d4a017",
        padding: 24,
        paddingTop: 35,
        alignItems: "center",

        // outer glow
        shadowColor: "#ffcc33",
        shadowOpacity: 1,
        shadowRadius: 30,
        shadowOffset: {
            width: 10,
            height: 10,
        },

        elevation: 25,
    },
    gradientBorder: {
        borderRadius: 32,
        padding: 2.5,
    },
    innerBorder: {
        position: "absolute",
        top: 6,
        left: 6,
        right: 6,
        bottom: 6,

        borderRadius: 24,

        borderWidth: 1,

        borderColor: "rgba(255,220,120,0.35)",
    },
    closeButton: {
        position: "absolute",
        right: 18,
        top: 18,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },

    closeText: {
        color: "white",
        fontSize: 28,
        lineHeight: 30,
    },

    trophy: {
        fontSize: 90,
        marginBottom: 10,
    },

    title: {
        color: "white",
        fontSize: 30,
        fontWeight: "900",
        textAlign: "center",
    },

    subtitle: {
        color: "#e5e7eb",
        fontSize: 17,
        textAlign: "center",
        marginTop: 10,
    },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginVertical: 14,
        gap: 12,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(251,191,36,0.45)",
    },

    earned: {
        color: "#facc15",
        fontWeight: "800",
        letterSpacing: 1,
    },

    rewardsRow: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },

    rewardCard: {
        flex: 1,
        minHeight: 140,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.04)",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
    },

    rewardIcon: {
        fontSize: 38,
        marginBottom: 8,
    },

    rewardValue: {
        color: "white",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
    },

    rewardLabel: {
        color: "#facc15",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 4,
    },

    button: {
        marginTop: 28,
        width: "75%",
        height: 58,
        borderRadius: 16,
        backgroundColor: "#14b8a6",
        alignItems: "center",
        justifyContent: "center",
    },

    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "900",
    },
});