import React, { useLayoutEffect } from "react";
import { updateSetting, useSettings } from "@/util/settings";
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    Switch,
    Alert,
    Dimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    cancelAnimation,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { resetOpeningProgress } from "@/util/storage";
import { playSound } from "@/util/chessUtils";
import { useAudioPlayer } from "expo-audio";
import { SOUNDS } from "@/util/sounds";

const screenWidth = Dimensions.get("window").width;

type SettingsModalProps = {
    visible: boolean,
    onClose: () => void,
};


export const SettingsModal = ({
    visible,
    onClose,
}: SettingsModalProps) => {


    const { highlightMoves, showMoveHints, soundEnabled } = useSettings();
    const changeSetting = (key: "highlightMoves" | "showMoveHints" | "soundEnabled", value: boolean) => {
        void updateSetting(key, value).catch(error => {
            console.log("Could not save settings:", error);
            Alert.alert("Settings not saved", "Your preference could not be saved. Any change shown applies to this session only. Please try again.");
        });
    };
    const overlayOpacity = useSharedValue(0);
    const translateX = useSharedValue(screenWidth);
    const illegalPlayer = useAudioPlayer(SOUNDS.illegal);
    const resetInFlight = React.useRef(false);
    const mounted = React.useRef(false);
    const closing = React.useRef(false);
    const visibilityGeneration = React.useRef(0);

    useLayoutEffect(() => {
        mounted.current = true;
        closing.current = false;
        const generation = ++visibilityGeneration.current;
        if (visible) {
            translateX.set(screenWidth);
            overlayOpacity.set(0);

            translateX.set(withTiming(0, {
                duration: 300,
            }));

            overlayOpacity.set(withTiming(1, {
                duration: 300,
            }));
        }
        return () => {
            mounted.current = false;
            visibilityGeneration.current = generation + 1;
            cancelAnimation(translateX);
            cancelAnimation(overlayOpacity);
        };
    }, [visible, translateX, overlayOpacity]);

    const handleResetProgress = async () => {
        if (resetInFlight.current) return;
        resetInFlight.current = true;
        try {
            await resetOpeningProgress();
        } catch (error) {
            console.log("Could not reset opening progress:", error);
            Alert.alert("Progress reset failed", "Opening progress could not be reset. Please try again.");
        } finally {
            resetInFlight.current = false;
        }
    };

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));


    const completeClose = (generation: number) => {
        if (!mounted.current || !visible || !closing.current || visibilityGeneration.current !== generation) return;
        // Invalidate duplicate UI-thread completions before notifying the parent.
        visibilityGeneration.current++;
        onClose();
    };

    const handleClose = () => {
        if (!mounted.current || !visible || closing.current) return;
        closing.current = true;
        const generation = visibilityGeneration.current;
        playSound(illegalPlayer);
        translateX.set(withTiming(
            screenWidth,
            { duration: 300 }
        ));

        overlayOpacity.set(withTiming(
            0,
            { duration: 300 },
            (finished) => {
                if (finished) {
                    runOnJS(completeClose)(generation);
                }
            }
        ));
    };

    return <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View
            style={[
                styles.overlay,
                overlayAnimatedStyle,
            ]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close Settings" style={StyleSheet.absoluteFill} onPress={handleClose} />
            <Animated.View style={[styles.settingsModal, animatedStyle]}>

                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>

                    <Pressable onPress={handleClose}>
                        <Text style={styles.close}>✕</Text>
                    </Pressable>
                </View>


                <SettingRow label="Highlight moves">
                    <Switch value={highlightMoves} onValueChange={value => changeSetting("highlightMoves", value)} />
                </SettingRow>

                <SettingRow label="Show Eval">
                    <Switch value={showMoveHints} onValueChange={value => changeSetting("showMoveHints", value)} />
                </SettingRow>

                <SettingRow label="Sounds">
                    <Switch value={soundEnabled} onValueChange={value => changeSetting("soundEnabled", value)} />
                </SettingRow>
                <SettingRow label="Remove Ads">
                    <Pressable style={styles.premiumButton}>
                        <Text style={styles.premiumButtonText}>
                            $2.99
                        </Text>
                    </Pressable>
                </SettingRow>
                <SettingRow label="Reset progress">
                    <Pressable onPress={handleResetProgress} style={styles.actionButton}>
                        <Text style={styles.actionText}>Reset</Text>
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
