import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { BlurMask, Canvas, Group, Path, Skia } from "@shopify/react-native-skia";
import {
    Easing,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

type VictoryRaysProps = {
    size?: number;
};

export default function VictoryRays({ size = 360 }: VictoryRaysProps) {
    const rotation = useSharedValue(0);
    const center = size / 2;

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(Math.PI * 2, {
                duration: 24000, // slower premium rotation
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const transform = useDerivedValue(() => [
        { translateX: center },
        { translateY: center },
        { rotate: rotation.value },
        { translateX: -center },
        { translateY: -center },
    ]);

    const rays = Array.from({ length: 18 }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / 18;
        const nextAngle = angle + Math.PI / 22;

        const innerRadius = 28;
        const outerRadius = size / 2;

        const path = Skia.Path.Make();

        path.moveTo(
            center + Math.cos(angle) * innerRadius,
            center + Math.sin(angle) * innerRadius
        );

        path.lineTo(
            center + Math.cos(angle) * outerRadius,
            center + Math.sin(angle) * outerRadius
        );

        path.lineTo(
            center + Math.cos(nextAngle) * outerRadius,
            center + Math.sin(nextAngle) * outerRadius
        );

        path.lineTo(
            center + Math.cos(nextAngle) * innerRadius,
            center + Math.sin(nextAngle) * innerRadius
        );

        path.close();
        return path;
    });

    return (
        <Canvas pointerEvents="none" style={{
            width: 200,
            height: 200,
            position: "absolute",
        }}>
            <Group transform={transform}>
                {rays.map((path, index) => (
                    <Path
                        key={index}
                        path={path}
                        color={
                            index % 2 === 0
                                ? "rgba(227, 250, 22, .2)"
                                : "rgba(255,255,255,0.025)"
                        }
                    >
                        <BlurMask blur={0} style="normal" />

                    </Path>
                ))}
            </Group>
        </Canvas>
    );
}