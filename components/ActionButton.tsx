import { COLORS } from "@/theme/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";



 function ActionButton({ icon, label, onPress }: { icon: React.ReactNode, label: string, onPress: () => void }) {
        return (
            <Pressable style={styles.actionItem} onPress={onPress}>
                <View style={styles.actionCircle}>
                    {icon}
                </View>
                <Text style={styles.actionLabel}>{label}</Text>
            </Pressable>
        );
    }

const styles = StyleSheet.create({
  actionItem: {
    alignItems: "center",
    gap: 8,
  },

  actionCircle: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "rgba(5, 46, 46, 0.7)",
    borderWidth: 4,
    borderColor: COLORS.board.border,
    justifyContent: "center",
    alignItems: "center",


    shadowColor: "#D9B46B",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  actionIcon: {
    fontSize: 36,
    color: COLORS.board.border,
    fontWeight: "900",
  },

  actionLabel: {
    color: COLORS.text.primary,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
    export default ActionButton;