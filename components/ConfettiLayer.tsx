import React, { useEffect, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import {
    Canvas,
    Group,
    RoundedRect,
} from "@shopify/react-native-skia";

const { width, height } = Dimensions.get("window");

export function ConfettiLayer({ active }: { active: boolean }) {
    const [time, setTime] = useState(0);

    useEffect(() => {
        if (!active) {
            setTime(0);
            return;
        }

        let frame: number;
        const start = Date.now();

        const animate = () => {
            setTime(Date.now() - start);
            frame = requestAnimationFrame(animate);
        };

        frame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frame);
    }, [active]);

    if (!active) return null;

    return (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {CONFETTI.map((item, index) => {
                const y = (item.y + time / item.speed) % height;
                const rotation = item.rotate + time / 500;

                return (
                    <Group
                        key={index}
                        transform={[
                            { translateX: item.x },
                            { translateY: y },
                            { rotate: rotation },
                        ]}
                    >
                        <RoundedRect
                            x={0}
                            y={0}
                            width={item.w}
                            height={item.h}
                            r={2}
                            color={item.color}
                        />
                    </Group>
                );
            })}
        </Canvas>
    );
}

const COLORS = [
    "#f97316",
    "#ec4899",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
    "#facc15",
];

const CONFETTI = Array.from({ length: 50 }).map((_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    w: 14,
    h: 7,
    rotate: Math.random() * Math.PI,
    speed: 4 + Math.random() * 8,
    color: COLORS[index % COLORS.length],
}));