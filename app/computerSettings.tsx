import { getLevelName } from "@/util/chessUtils";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ComputerSettingsScreen() {
  const [playerSide, setplayerSide] = useState<"w" | "r" | "b">("w");
  const [level, setLevel] = useState(1);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText}>PLAY VS COMPUTER</Text>
      </View>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Play as</Text>

        <View style={styles.sideRow}>
          <SideButton label="White" icon="♙" active={playerSide === "w"} onPress={() => setplayerSide("w")} />
          <SideButton label="Random" icon="◐" active={playerSide === "r"} onPress={() => setplayerSide("r")} />
          <SideButton label="Black" icon="♟" active={playerSide === "b"} onPress={() => setplayerSide("b")} />
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Difficulty level</Text>
        <Text style={styles.levelText}>{level} - {getLevelName(level)}</Text>

        <View style={styles.levelRow}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <Pressable
              key={num}
              style={[styles.levelDot, level === num && styles.levelDotActive]}
              onPress={() => setLevel(num)}
            />
          ))}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>Games Won: 0</Text>
          <Text style={styles.stat}>Games Lost: 0</Text>
          <Text style={styles.stat}>Win Rate: 0%</Text>
        </View>
      </View>

      <Pressable
        style={styles.playButton}
        onPress={() => {
          router.push({
            pathname: "/match",
            params: {
              side: playerSide,
              level: String(level),
            },
          });
        }}
      >
        <Text style={styles.playText}>PLAY NOW</Text>
      </Pressable>
    </View>
  );
}

function SideButton({ label, icon, active, onPress }: any) {
  return (
    <Pressable style={[styles.sideButton, active && styles.sideButtonActive]} onPress={onPress}>
      <Text style={styles.sideIcon}>{icon}</Text>
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
    </Pressable>
  );
}



const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#06282d",
    paddingHorizontal: 14,
  },
  header: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  backButton: {
    position: "absolute",
    top: 115,
    left: 20,
  },
  backText: {
    color: "#f5c542",
    fontSize: 72,
    fontWeight: "900",
  },
  panel: {
    backgroundColor: "#7a330f",
    borderWidth: 4,
    borderColor: "#f5c542",
    borderRadius: 14,
    padding: 18,
    marginTop: 26,
  },
  panelTitle: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 18,
  },
  sideRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sideButton: {
    width: "30%",
    height: 135,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#4a1b07",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5b2108",
  },
  sideButtonActive: {
    borderColor: "#f5c542",
    backgroundColor: "#8a3a12",
  },
  sideIcon: {
    fontSize: 56,
    color: "#fff",
  },
  sideLabel: {
    color: "#c99672",
    fontWeight: "900",
    marginTop: 8,
  },
  sideLabelActive: {
    color: "#f5c542",
  },
  levelText: {
    color: "#f5c542",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 22,
  },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
  },
  levelDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#a85a2a",
  },
  levelDotActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#f5c542",
    transform: [{ rotate: "45deg" }],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    color: "#f5c542",
    fontSize: 12,
    fontWeight: "800",
  },
  playButton: {
    marginTop: 40,
    alignSelf: "center",
    width: "72%",
    height: 70,
    borderRadius: 14,
    backgroundColor: "#21c900",
    borderBottomWidth: 6,
    borderBottomColor: "#064d00",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
});