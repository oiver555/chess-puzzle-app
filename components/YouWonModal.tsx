import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import GameButton from "./GameButton";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type WinModalProps = {
  visible: boolean;
  wins: number;
  requiredWins?: number;
  onNewGame: () => void;
  onGameView: () => void;
  onClose?: () => void;
};

export default function WinModal({
  visible,
  wins,
  requiredWins = 5,
  onNewGame,
  onGameView,
  onClose,
}: WinModalProps) {
  const progressPercent = Math.min(wins / requiredWins, 1) * 100;
  const chestScale = useSharedValue(1);
  const chestRotate = useSharedValue(0);
  const chestY = useSharedValue(0);

  useEffect(() => {
    chestScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(1.22, { duration: 140 }),
        withTiming(0.95, { duration: 90 }),
        withTiming(1.1, { duration: 110 }),
        withTiming(1, { duration: 140 })
      ),
      -1,
      false
    );

    chestRotate.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(-12, { duration: 70 }),
        withTiming(12, { duration: 70 }),
        withTiming(-8, { duration: 70 }),
        withTiming(8, { duration: 70 }),
        withTiming(0, { duration: 120 })
      ),
      -1,
      false
    );

    chestY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900 }),
        withTiming(-8, { duration: 140 }),
        withTiming(0, { duration: 160 })
      ),
      -1,
      false
    );
  }, []);

  const chestAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: chestY.value },
      { scale: chestScale.value },
      { rotate: `${chestRotate.value}deg` },
    ],
  }));

  const modalY = useSharedValue(-600);
  const modalScale = useSharedValue(0.9);

  useEffect(() => {
    if (!visible) {
      modalY.value = -600;
      modalScale.value = 0.9;
      return;
    }

    modalY.value = withSequence(
      withTiming(40, { duration: 400 }),
      withTiming(0, { duration: 120 })
    );

    modalScale.value = withSequence(
      withTiming(1.05, { duration: 400 }),
      withTiming(1, { duration: 120 })
    );
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: modalY.value },
      { scale: modalScale.value },
    ],
  }));

  return (
    <Animated.View style={modalAnimatedStyle}>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <LinearGradient
            colors={["#075247", "#043B34", "#022A25"]}
            style={styles.modal}
          >
            {onClose && (
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={28} color="#E3BE6A" />
              </Pressable>
            )}



            <View style={styles.titleWrap}>
              <Text style={styles.title}>YOU WON!</Text>
            </View>
            <Text style={styles.subtitle}>
              Great strategy! You defeated the opponent.
            </Text>

            <View style={styles.progressBox}>
              <Text style={styles.progressTitle}>
                WON GAME {wins}/{requiredWins}
              </Text>

              <View style={styles.progressArea}>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>

                <View style={styles.steps}>
                  {Array.from({ length: requiredWins }).map((_, index) => {
                    const stepNumber = index + 1;
                    const active = stepNumber <= wins;
                    const isPrize = stepNumber === requiredWins;

                    return (
                      <View
                        key={stepNumber}
                        style={[
                          isPrize ? styles.prizeDot : styles.stepDot,
                          active && !isPrize && styles.stepDotActive,
                          active && isPrize && styles.prizeDotActive,
                        ]}
                      >
                        {isPrize && (
                          <Animated.View style={chestAnimatedStyle}>
                            <MaterialCommunityIcons
                              name="treasure-chest"
                              size={28}
                              color="#E3BE6A"
                            />
                          </Animated.View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.prizeText}>
                Keep winning to claim a prize!
              </Text>
            </View>

            <GameButton
              label="NEW GAME"
              icon="refresh"
              onPress={onNewGame}
            />

            {/* <GameButton
            label="GAME VIEW"
            icon="stats-chart"
            variant="outline"
            onPress={onGameView}
            style={{ marginTop: 14 }}
          /> */}
          </LinearGradient>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    width: "100%",

  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#E3BE6A",
    letterSpacing: 1.4,
    textShadowColor: "rgba(227,190,106,0.55)",
    textShadowRadius: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modal: {
    width: "100%",
    maxWidth: 390,
    borderWidth: 3,
    borderColor: "rgba(224,192,109,0.75)",
    borderRadius: 32,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 18,
  },

  closeButton: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#D8B765",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  kingCircle: {
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: "rgba(227,190,106,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },


  subtitle: {
    color: "#F3F0E8",
    fontSize: 18,
    lineHeight: 25,
    textAlign: "center",
    marginBottom: 28,
  },

  progressBox: {
    width: "100%",
    borderWidth: 2,
    borderColor: "rgba(227,190,106,0.38)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    marginBottom: 28,
  },

  progressTitle: {
    color: "#F3F0E8",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 22,
    letterSpacing: 0.6,
  },

  progressArea: {
    height: 58,
    justifyContent: "center",
    marginBottom: 18,
  },

  track: {
    position: "absolute",
    left: 18,
    right: 34,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(227,190,106,0.2)",
    overflow: "hidden",
  },

  trackFill: {
    height: "100%",
    backgroundColor: "#E3BE6A",
    borderRadius: 8,
  },

  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#063B34",
    borderWidth: 3,
    borderColor: "rgba(227,190,106,0.55)",
  },

  stepDotActive: {
    backgroundColor: "#E3BE6A",
    borderColor: "#FFF1B8",
    shadowColor: "#E3BE6A",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },

  prizeDot: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#063B34",
    borderWidth: 3,
    borderColor: "rgba(227,190,106,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  prizeDotActive: {
    backgroundColor: "rgba(227,190,106,0.18)",
    shadowColor: "#E3BE6A",
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },

  prizeText: {
    color: "#F3F0E8",
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
});