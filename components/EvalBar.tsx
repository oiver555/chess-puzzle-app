import React from "react";
import { View, Text, Animated } from "react-native";

type EvalBarProps = {
    score: number;
};

export default function EvalBar({ score }: EvalBarProps) {
    const animatedBlackPercent = React.useRef(new Animated.Value(50)).current;
    const clampedScore = Math.max(-5, Math.min(5, score));
    const blackPercent = ((clampedScore + 5) / 10) * 100;
    const whitePercent = 100 - blackPercent;

    React.useEffect(() => {
        Animated.timing(animatedBlackPercent, {
            toValue: blackPercent,
            duration: 350,
            useNativeDriver: false,
        }).start();
    }, [blackPercent]);

    const blackHeight = animatedBlackPercent.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
    });

    const whiteHeight = animatedBlackPercent.interpolate({
        inputRange: [0, 100],
        outputRange: ["100%", "0%"],
    });

    return (
        <View
            style={{
                width: 30,
                height: 420,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#333",
                backgroundColor: "#000",
            }}
        >
            {/* Black Advantage */}
            <Animated.View
                style={{
                    height: blackHeight,
                    backgroundColor: "#111",
                }}
            />

            {/* White Advantage */}
            <Animated.View
                style={{
                    height: whiteHeight,
                    backgroundColor: "#f5f5f5",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: 8,
                }}
            >
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#111",
                    }}
                >
                    {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                </Text>
            </Animated.View>
        </View>
    );
}