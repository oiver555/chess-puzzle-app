import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { saveAppState } from "@/util/storage";
import Header from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { playSound } from "@/util/chessUtils";
import { useAudioPlayer } from "expo-audio";
import { SOUNDS } from "@/util/sounds";

const { width, height } = Dimensions.get("window");

const isSmallPhone = height < 700;
const isNarrowPhone = width < 380;

const COLORS = {
  dark: "#062E26",
  dark2: "#031D19",
  cream: "#F8F2E6",
  card: "#FFFDF8",
  gold: "#D5A94A",
  text: "#07352D",
  muted: "#385A52",
};
type Difficulty = "rookie" | "skilled" | "advanced" | "master";

const difficulties: {
  title: Difficulty;
  subtitle: string;
  elo: string;
  icon: string; 

}[] = [
    { 
      title: "rookie",
      subtitle: "Beginners",
      elo: "400 - 800 ELO",
      icon: "chess-knight",
    },
    {
      title: "skilled",
      subtitle: "Improve your strategy",
      elo: "800 - 1200 ELO",
      icon: "chess-bishop",
    },
    {
      title: "advanced",
      subtitle: "Strong tactical play",
      elo: "1200 - 1600 ELO",
      icon: "chess-rook",
    },
    {
      title: "master",
      subtitle: "For experienced players",
      elo: "1600+ ELO",
      icon: "chess-queen",
    },
  ];

export default function ComputerSettings() {
  const [side, setSide] = useState<"w" | "r" | "b">("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("rookie");
  const [showSettings, setShowSettings] = React.useState(false);
  const illegalPlayer = useAudioPlayer(SOUNDS.illegal);
  const pathname = usePathname()

  useEffect(() => {
    saveAppState({
      lastRoute: pathname,
      savedAt: new Date().toISOString(),
    });
  })



  return (
    <View style={styles.screen}>
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      <Header location="\" onSettings={() => setShowSettings(true)} variant={3} title="PLAY VS COMPUTER" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Image
            source={require("../assets/images/home/board-pattern.png")}
            style={styles.boardPattern}
            resizeMode="cover"
          />

          <View style={styles.heroText}>
            <Text numberOfLines={3} adjustsFontSizeToFit style={styles.title}>CHOOSE YOUR{"\n"}SETTINGS</Text>
            <View style={styles.goldLine} />
          </View>

          <Image
            source={require("../assets/images/home/chess-hero.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <SectionTitle icon="chess-pawn" title="PLAY AS" />

        <View style={styles.sideCard}>
          <SideOption
            label="WHITE"
            icon="chess-pawn"
            active={side === "w"}
            onPress={() => {
              playSound(illegalPlayer)
              setSide("w")
            }}
          />

          <SideOption
            label="RANDOM"
            icon="shuffle-variant"
            active={side === "r"}
            onPress={() => {
              playSound(illegalPlayer)
              setSide("r")
            }}
          />

          <SideOption
            label="BLACK"
            icon="chess-pawn"
            active={side === "b"}
            onPress={() => {
              playSound(illegalPlayer)
              setSide("b")
            }}
            darkPiece
          />
        </View>

        <SectionTitle icon="chart-bar" title="DIFFICULTY LEVEL" />

        <View style={styles.difficultyCard}>
          {difficulties.map((item, index) => {
            const active = difficulty === item.title;

            return (
              <Pressable
                key={item.title}
                onPress={() => {
                  playSound(illegalPlayer)
                  setDifficulty(item.title)
                }}
                style={[
                  styles.difficultyRow,
                  active && styles.difficultyRowActive,
                  index !== difficulties.length - 1 && !active && styles.rowBorder,
                ]}
              >
                <View style={[styles.diffIcon, active && styles.diffIconActive]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={30}
                    color={active ? COLORS.gold : COLORS.text}
                  />
                </View>

                <View style={styles.diffText}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.diffTitle, active && styles.diffTitleActive]}>
                    {item.title.toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.elo, active && styles.eloActive]}>
                  {item.elo}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={active ? COLORS.gold : COLORS.text}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.statsCard}>
          <Stat icon="trophy" label="WINS" value="0" />
          <Stat icon="shield-check" label="LOSSES" value="0" />
          <Stat icon="chart-line" label="WIN RATE" value="0%" />
        </View>

        <Pressable
          style={styles.startButton}
          onPress={() => {
            playSound(illegalPlayer)
            router.push({
              pathname: "/Match",
              params: {
                side,
                difficulty,
              },
            })
          }}
        >
          <MaterialCommunityIcons name="chess-king" size={36} color={COLORS.gold} />
          <Text style={styles.startText}>START</Text>
          <Ionicons name="chevron-forward" size={34} color={COLORS.gold} />
        </Pressable>
      </ScrollView>
    </View >
  );
}

function SectionTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionIcon}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

function SideOption({
  label,
  icon,
  active,
  onPress,
  darkPiece = false,
}: {
  label: string;
  icon: any;
  active: boolean;
  onPress: () => void;
  darkPiece?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.sideOption, active && styles.sideOptionActive]}>
      <MaterialCommunityIcons
        name={icon}
        size={isSmallPhone ? 34 : 42}
        color={active && darkPiece ? "#fff" : darkPiece ? "#151515" : active ? "#fff" : COLORS.text}
      />
      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={COLORS.text} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  content: {
    paddingBottom: 34,
  },

  hero: {
    height: isSmallPhone ? 210 : 250,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
    backgroundColor: COLORS.cream,
  },

  boardPattern: {
    ...StyleSheet.absoluteFill,
    width,
    height: "100%",
    opacity: 1,
  },

  heroText: {
    flex: 1,
    zIndex: 2,
  },

  title: {
    fontSize: isNarrowPhone ? 28 : 34,
    lineHeight: isNarrowPhone ? 34 : 40,
    fontWeight: "900",
    color: COLORS.text,
  },

  goldLine: {
    marginTop: 18,
    width: 110,
    height: 4,
    borderRadius: 20,
    backgroundColor: COLORS.gold,
  },

  heroImage: {
    width: width * 0.46,
    height: "105%",
    zIndex: 1,
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },

  sideCard: {
    marginHorizontal: 20,
    padding: 8,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  sideOption: {
    flex: 1,
    minHeight: isSmallPhone ? 92 : 112,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF7ED",
  },

  sideOptionActive: {
    backgroundColor: COLORS.dark,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },

  sideLabel: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: isNarrowPhone ? 15 : 18,
    fontWeight: "900",
  },

  sideLabelActive: {
    color: "#fff",
  },

  difficultyCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  difficultyRow: {
    minHeight: isSmallPhone ? 70 : 82,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  difficultyRowActive: {
    backgroundColor: COLORS.dark,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(7,53,45,0.12)",
  },

  diffIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F2E7D5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  diffIconActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  diffText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10
  },

  diffTitle: {
    color: COLORS.text,
    fontSize: isNarrowPhone ? 16 : 19,
    fontWeight: "900",
  },

  diffTitleActive: {
    color: "#fff",
  },

  diffSubtitle: {
    color: COLORS.muted,
    fontSize: isNarrowPhone ? 12 : 14,
    marginTop: 2,
  },

  diffSubtitleActive: {
    color: "#F2E7D5",
  },

  elo: {
    color: COLORS.text,
    fontSize: isNarrowPhone ? 12 : 14,
    fontWeight: "800",
    marginRight: 4,
    width: 120,
    textAlign: "right",
  },

  eloActive: {
    color: COLORS.gold,
  },

  statsCard: {
    marginTop: 18,
    marginHorizontal: 20,
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F2E7D5",
    alignItems: "center",
    justifyContent: "center",
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: "800",
  },

  statValue: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: "900",
  },

  startButton: {
    marginTop: 26,
    marginHorizontal: 20,
    height: isSmallPhone ? 76 : 86,
    borderRadius: 26,
    backgroundColor: COLORS.dark,
    borderWidth: 2,
    borderColor: COLORS.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  startText: {
    color: "#fff",
    fontSize: isNarrowPhone ? 26 : 32,
    fontWeight: "900",
    letterSpacing: 1,
  },
});