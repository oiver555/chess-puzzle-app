import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

import Piece, { PieceCode } from "./Piece";

type PromotionModalProps = {
  visible: boolean;
  playerColor: "w" | "b";
  onPromote: (piece: "q" | "r" | "b" | "n") => void;
};

export default function PromotionModal({
  visible,
  playerColor,
  onPromote,
}: PromotionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            Promote Pawn
          </Text>

          <View style={styles.promotionRow}>
            {(["q", "r", "b", "n"] as const).map((piece) => (
              <Pressable
                key={piece}
                style={styles.promotionButton}
                onPress={() => onPromote(piece)}
              >
                <Piece
                  code={
                    playerColor === "w"
                      ? (piece.toUpperCase() as PieceCode)
                      : (piece as PieceCode)
                  }
                  size={42}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "82%",
    backgroundColor: "#7a330f",
    borderWidth: 4,
    borderColor: "#f5c542",
    borderRadius: 14,
    padding: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },

  promotionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },

  promotionButton: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: "#f5c542",
    justifyContent: "center",
    alignItems: "center",
  },
});