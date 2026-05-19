import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export const openings = [
  {
    eco: "D02",
    name: "London System",
    commentary:
      "A solid opening focused on safe development and center control.",
    mastery: 65,
    icon: "chess-pawn",
    color: "#FFD95A",
  },
  {
    eco: "C50",
    name: "Italian Game",
    commentary:
      "A classic attacking opening that targets the weak f7 square.",
    mastery: 40,
    icon: "chess-bishop",
    color: "#2EC4FF",
  },
  {
    eco: "B20",
    name: "Sicilian Defense",
    commentary:
      "An aggressive response to 1.e4 that leads to sharp positions.",
    mastery: 10,
    icon: "chess-rook",
    color: "#FF2B2B",
  },
  {
    eco: "D06",
    name: "Queen's Gambit",
    commentary:
      "A positional opening where White offers a pawn for center control.",
    mastery: 75,
    icon: "chess-queen",
    color: "#A855F7",
  },
  {
    eco: "C60",
    name: "Ruy Lopez",
    commentary:
      "One of the oldest and most respected openings in chess.",
    mastery: 25,
    icon: "chess-knight",
    color: "#20D6D6",
  },
  {
    eco: "B10",
    name: "Caro-Kann Defense",
    commentary:
      "A reliable defense with a solid pawn structure and clear plans.",
    mastery: 0,
    icon: "chess-pawn",
    color: "#FF8A00",
  },
];

export default function LearnOpeningsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Pressable style={styles.circleButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={34} color="#fff" />
        </Pressable> */}

        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="chess-king" size={34} color="#FFD95A" />
          <Text style={styles.title}>LEARN OPENINGS</Text>
          <Text style={styles.subtitle}>Master openings step by step</Text>
        </View>

        {/* <Pressable style={styles.settingsButton}>
          <Ionicons name="settings-sharp" size={34} color="#000" />
        </Pressable> */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search */}
        {/* <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={26} color="#A8B8B8" />
            <TextInput
              placeholder="Search openings..."
              placeholderTextColor="#A8B8B8"
              style={styles.searchInput}
            />
          </View>

          <Pressable style={styles.filterButton}>
            <Ionicons name="options" size={24} color="#fff" />
            <Text style={styles.filterText}>Filter</Text>
          </Pressable>
        </View> */}

        {/* Opening Cards */}
        {/* {openings.map((opening) => (
          <Pressable
            key={opening.eco}
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: "/opening-detail",
                params: { eco: opening.eco },
              });
            }}
          >
            <View style={[styles.iconCircle, { borderColor: opening.color }]}>
              <MaterialCommunityIcons
                name={opening.icon as any}
                size={48}
                color={opening.color}
              />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.openingName}>{opening.name}</Text>
              <Text style={[styles.eco, { color: opening.color }]}>
                ECO: {opening.eco}
              </Text>
              <Text style={styles.commentary}>{opening.commentary}</Text>
            </View>

            <View style={styles.masteryBox}>
              <View style={[styles.masteryCircle, { borderColor: opening.color }]}>
                <Text style={styles.masteryText}>{opening.mastery}%</Text>
              </View>
              <Text style={[styles.masteryLabel, { color: opening.color }]}>
                Mastered
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={28} color="#D8D8D8" />
          </Pressable>
        ))} */}

        {/* Start Path */}
        {/* <View style={styles.startCard}>
          <MaterialCommunityIcons name="book-open-page-variant" size={38} color="#FFD95A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.startTitle}>Not sure where to start?</Text>
            <Text style={styles.startText}>Try the recommended learning path.</Text>
          </View>
          <Pressable style={styles.startButton}>
            <Text style={styles.startButtonText}>Start Path</Text>
            <Ionicons name="chevron-forward" size={20} color="#000" />
          </Pressable>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#063839",
  },

  header: {
    height: 180,
    backgroundColor: "#8A3513",
    borderBottomWidth: 5,
    borderBottomColor: "#FFD95A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    justifyContent: "space-between",
  },

  circleButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 6,
    borderColor: "#FFD95A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  headerCenter: {
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 2,
  },

  subtitle: {
    color: "#F3D6C8",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  settingsButton: {
    width: 78,
    height: 78,
    borderRadius: 18,
    backgroundColor: "#D60000",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  searchBox: {
    flex: 1,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0F6668",
    backgroundColor: "#073F42",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    marginLeft: 10,
  },

  filterButton: {
    height: 64,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#0F6668",
    backgroundColor: "#073F42",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  filterText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  card: {
    minHeight: 132,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#0F6668",
    backgroundColor: "#07484A",
    marginBottom: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  cardText: {
    flex: 1,
  },

  openingName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },

  eco: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },

  commentary: {
    color: "#D8E6E6",
    fontSize: 15,
    lineHeight: 20,
  },

  masteryBox: {
    alignItems: "center",
    width: 72,
  },

  masteryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  masteryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  masteryLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
  },

  startCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#0F6668",
    backgroundColor: "#07484A",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  startTitle: {
    color: "#FFD95A",
    fontSize: 19,
    fontWeight: "900",
  },

  startText: {
    color: "#D8E6E6",
    fontSize: 14,
    marginTop: 4,
  },

  startButton: {
    backgroundColor: "#FFD95A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  startButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 15,
  },
});