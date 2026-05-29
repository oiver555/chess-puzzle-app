import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    Switch,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { Dimensions } from "react-native";
import { runOnJS } from "react-native-worklets";

const screenWidth = Dimensions.get("window").width;

type SettingsModalProps = {
    visible: boolean,
    onClose: () => void,
};


export const SettingsModal = ({
    visible,
    onClose,
}: SettingsModalProps) => {


    const [highlightMoves, setHighlightMoves] = useState(true);
    const [showMoveHints, setShowMoveHints] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const overlayOpacity = useSharedValue(0);
    const translateX = useSharedValue(screenWidth);

    useEffect(() => {
        if (visible) {
            translateX.value = screenWidth;
            overlayOpacity.value = 0;

            translateX.value = withTiming(0, {
                duration: 300,
            });

            overlayOpacity.value = withTiming(1, {
                duration: 300,
            });
        }
    }, [visible]);

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));


    const handleClose = () => {
        translateX.value = withTiming(
            screenWidth,
            { duration: 300 }
        );

        overlayOpacity.value = withTiming(
            0,
            { duration: 300 },
            (finished) => {
                if (finished) {
                    runOnJS(onClose)();
                }
            }
        );
    };

    return <Modal visible={visible} transparent animationType="none">
        <Animated.View style={[
            styles.overlay,
            overlayAnimatedStyle,
        ]}>
            <Animated.View style={[styles.settingsModal, animatedStyle]}>

                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>

                    <Pressable onPress={handleClose}>
                        <Text style={styles.close}>✕</Text>
                    </Pressable>
                </View>


                <SettingRow label="Highlight legal moves">
                    <Switch value={highlightMoves} onValueChange={setHighlightMoves} />
                </SettingRow>

                <SettingRow label="Show move hints">
                    <Switch value={showMoveHints} onValueChange={setShowMoveHints} />
                </SettingRow>

                <SettingRow label="Sounds">
                    <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
                </SettingRow>

                <SettingRow label="Reset progress">
                    <Pressable style={styles.actionButton}>
                        <Text style={styles.actionText}>Reset</Text>
                    </Pressable>
                </SettingRow>
                <SettingRow label="Remove Ads">
                    <Pressable style={styles.premiumButton}>
                        <Text style={styles.premiumButtonText}>
                            $2.99
                        </Text>
                    </Pressable>
                </SettingRow>

            </Animated.View>
        </Animated.View>
    </Modal>
}

function SettingRow({ label, children }: any) {
    return (
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            {children}
        </View>
    );
}


const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    settingsModal: {
        width: "100%",
        maxWidth: 500,
        backgroundColor: "#2B1710",
        borderRadius: 24,
        borderWidth: 3,
        borderColor: "#D9A441",
        padding: 18,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },

    title: {
        color: "#F5E6C8",
        fontSize: 24,
        fontWeight: "800",
    },

    close: {
        color: "#F5E6C8",
        fontSize: 26,
        fontWeight: "900",
    },

    settingRow: {
        minHeight: 72,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.12)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },

    settingLabel: {
        color: "#F5E6C8",
        fontSize: 16,
        fontWeight: "700",
        flex: 1,
    },

    segmentGroup: {
        flexDirection: "row",
        backgroundColor: "#140C08",
        borderRadius: 16,
        padding: 4,
    },

    segment: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
    },

    segmentActive: {
        backgroundColor: "#D9A441",
    },

    segmentText: {
        color: "#fff",
        fontWeight: "800",
    },

    actionButton: {
        backgroundColor: "#D9A441",
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 14,
    },

    actionText: {
        color: "#24130C",
        fontWeight: "900",
        fontSize: 16,
    },
    premiumButton: {
        backgroundColor: "#D9A441",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },

    premiumButtonText: {
        color: "#24130C",
        fontWeight: "800",
        fontSize: 15,
    },
});