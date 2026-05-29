import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    Text,
    StyleSheet,
    View,
    ViewStyle,
    TextStyle,
    LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    Canvas,
    RoundedRect,
    LinearGradient,
    vec,
    Shadow,
    Group,
    Rect,
    Skia,
    rect,
    rrect,
} from "@shopify/react-native-skia";
import {
    Easing,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

type GameButtonProps = {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    variant?: "gold" | "outline";
    style?: ViewStyle;
    textStyle?: TextStyle;
};

export default function GameButton({
    label,
    icon,
    onPress,
    variant = "gold",
    style,
    textStyle,
}: GameButtonProps) {
    const [width, setWidth] = useState(0);

    const isGold = variant === "gold";
    const height = 62;
    const radius = 18;

    // const sweepX = useSharedValue(-140);

    // useEffect(() => {
    //     if (width === 0) return;

    //     sweepX.value = -140;
    //     sweepX.value = withRepeat(
    //         withTiming(width + 140, {
    //             duration: 1800,
    //             easing: Easing.inOut(Easing.ease),
    //         }),
    //         -1,
    //         false
    //     );
    // }, [width]);

    // const sweepTransform = useDerivedValue(() => [
    //     { translateX: sweepX.value },
    //     { translateY: -22 },
    //     { rotate: -0.35 },
    // ]);

    const clipPath = useMemo(() => {
        if (width === 0) return undefined;

        const path = Skia.Path.Make();
        path.addRRect(rrect(rect(1, 1, width - 2, height - 2), radius, radius));
        return path;
    }, [width]);

    const handleLayout = (e: LayoutChangeEvent) => {
        setWidth(e.nativeEvent.layout.width);
    };

    return (
        <Pressable
            onPress={onPress}
            onLayout={handleLayout}
            style={({ pressed }) => [
                styles.wrapper,
                pressed && styles.pressed,
                style,
            ]}
        >
            {width > 0 && (
                <Canvas style={StyleSheet.absoluteFill}>
                    {isGold && (
                        <RoundedRect
                            x={4}
                            y={4}
                            width={width - 8}
                            height={height - 8}
                            r={radius}
                            color="rgba(227,190,106,0.35)"
                        >
                            <Shadow
                                dx={0}
                                dy={0}
                                blur={22}
                                color="rgba(227,190,106,0.75)"
                            />
                        </RoundedRect>
                    )}

                    <RoundedRect x={1} y={1} width={width - 2} height={height - 2} r={radius}>
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, height)}
                            colors={
                                isGold
                                    ? ["#FFF4BD", "#E4C36E", "#B78331"]
                                    : ["#1A6659", "#075247", "#023C35"]
                            }
                        />
                    </RoundedRect>

                    {/* {clipPath && (
                        <Group clip={clipPath}>
                            <Group
                            //   transform={sweepTransform}
                            >
                                <Rect x={0} y={0} width={46} height={120}>
                                    <LinearGradient
                                        start={vec(0, 0)}
                                        end={vec(46, 0)}
                                        colors={[
                                            "rgba(255,255,255,0)",
                                            "rgba(255,255,255,0.6)",
                                            "rgba(255,255,255,0)",
                                        ]}
                                    />
                                </Rect>
                            </Group>
                        </Group>
                    )} */}

                    <RoundedRect
                        x={1.5}
                        y={1.5}
                        width={width - 3}
                        height={height - 3}
                        r={radius}
                        style="stroke"
                        strokeWidth={2}
                    >
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, height)}
                            colors={
                                isGold
                                    ? ["#FFF9D6", "#E3BE6A", "#8F6728"]
                                    : ["#F2D27A", "#B98B3A", "#E3BE6A"]
                            }
                        />
                    </RoundedRect>

                    <RoundedRect x={10} y={6} width={width - 20} height={16} r={10}>
                        <LinearGradient
                            start={vec(0, 6)}
                            end={vec(0, 22)}
                            colors={[
                                "rgba(255,255,255,0.32)",
                                "rgba(255,255,255,0.02)",
                            ]}
                        />
                    </RoundedRect>

                    <RoundedRect x={2} y={height - 24} width={width - 4} height={22} r={radius}>
                        <LinearGradient
                            start={vec(0, height - 24)}
                            end={vec(0, height)}
                            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.26)"]}
                        />
                    </RoundedRect>
                </Canvas>
            )}

            <View style={styles.content}>
                {icon && (
                    <Ionicons
                        name={icon}
                        size={26}
                        color={isGold ? "#073B34" : "#E3BE6A"}
                        style={styles.icon}
                    />
                )}

                <Text
                    style={[
                        styles.text,
                        isGold ? styles.goldText : styles.outlineText,
                        textStyle,
                    ]}
                >
                    {label}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        height: 62,
        borderRadius: 18,
        overflow: "hidden",
    },

    pressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.92,
    },

    content: {
        flex: 1,
        height: 62,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    icon: {
        marginRight: 12,
    },

    text: {
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 1.4,
    },

    goldText: {
        color: "#073B34",
        textShadowColor: "rgba(255,255,255,0.4)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },

    outlineText: {
        color: "#E3BE6A",
        textShadowColor: "rgba(0,0,0,0.55)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
});