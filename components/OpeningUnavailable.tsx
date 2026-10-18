import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { COLORS } from "@/theme/colors";

export function backToOpenings() {
  if (router.canGoBack()) router.back();
  else router.replace("/LearnOpenings");
}

export default function OpeningUnavailable() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, padding: 24 }}>
      <Text style={{ color: COLORS.text.primary, fontSize: 24 }}>Opening unavailable</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/LearnOpenings")} style={{ padding: 20 }}>
        <Text style={{ color: COLORS.text.primary }}>Back to openings</Text>
      </Pressable>
    </View>
  );
}
