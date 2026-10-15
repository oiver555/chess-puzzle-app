// components/ClaimHintModal.tsx

import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image
} from "react-native";
import Animated, {
  Easing, 
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type ClaimHintModalProps = {
  visible: boolean;
  amount?: number;
  onClaim: () => void;
  onDismiss: () => void;
};

export default function ClaimHintModal({
  visible,
  amount = 2,
  onClaim,
  onDismiss,
}: ClaimHintModalProps) {
  const pulse = useSharedValue(.1);
  const rotate = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      true
    );

    rotate.value = withRepeat(
      withTiming(360, {
        duration: 7000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.25, { duration: 900 })
      ),
      -1,
      true
    );
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>CLAIM HINTS!</Text>

          <View style={styles.iconArea}>
           
            <Animated.View style={[styles.chestContainer]}>
                <Image source={require("../assets/images/treasure-chest.png")}  resizeMode="none" style={{width: "100%", height: "100%"}} />
            </Animated.View>
          </View>

          <Text style={styles.amount}>x{amount}</Text>

          <Pressable style={styles.claimButton} onPress={onClaim}>
            <Text style={styles.claimText}>CLAIM</Text>
          </Pressable>

          <Pressable onPress={onDismiss}>
            <Text style={styles.noThanks}>NO THANKS</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  chestContainer: {
  width: 180,
  height: 180,
  alignItems: "center",
  justifyContent: "center",
},
  card: {
    width: "86%",
    minHeight: 430,
    borderRadius: 28,
    backgroundColor: "#07352D",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderWidth: 3,
    borderColor: "#D5A94A",
  },
  title: {
    color: "#F8F2E6",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 18,
  },
  iconArea: {
    width: 210,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  rays: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
    width: 10,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255,216,77,0.35)",
  },
  bulbCircle: {
    width: 135,
    height: 135,
    borderRadius: 70,
    backgroundColor: "#0E4B4B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFD84D",
    shadowColor: "#FFD84D",
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
  },
  sparkle: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFF2A8",
  },
  sparkleOne: {
    top: 28,
    right: 40,
  },
  sparkleTwo: {
    top: 60,
    left: 25,
    width: 8,
    height: 8,
  },
  sparkleThree: {
    bottom: 42,
    right: 24,
    width: 9,
    height: 9,
  },
  sparkleFour: {
    bottom: 65,
    left: 36,
    width: 7,
    height: 7,
  },
  amount: {
    color: "#FFD84D",
    fontSize: 36,
    fontWeight: "900",
    marginTop: -4,
    marginBottom: 18,
  },
  claimButton: {
    width: "82%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#D5A94A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  claimText: {
    color: "#07352D",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1,
  },
  noThanks: {
    color: "#F8F2E6",
    fontSize: 15,
    fontWeight: "700",
    opacity: 0.8,
  },
});