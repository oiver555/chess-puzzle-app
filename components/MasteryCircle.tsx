import { COLORS } from "@/theme/colors";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function MasteryCircle({
    percent,
    color,
    fontSize = 22,
    size = 96,
    strokeWidth = 10,
}: {
    percent: number;
    color: string;
    size?: number;
    fontSize?: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference * (1 - percent / 100);

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <Circle
                    stroke="rgba(255,255,255,0.12)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                />

                <Circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    rotation="-90"
                    originX={size / 2}
                    originY={size / 2}
                />
            </Svg>

            <View style={styles.masteryCenter}>
                <Text style={[styles.progressPercent, { fontSize, }]}>{percent}%</Text>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    masteryCircleWrap: {
        width: 96,
        height: 96,
    },

    masteryCenter: {
        ...StyleSheet.absoluteFill,
        alignItems: "center",
        justifyContent: "center",
    },
    progressPercent: {
        color: COLORS.text.primary,
        fontWeight: "900",
    },
}) 