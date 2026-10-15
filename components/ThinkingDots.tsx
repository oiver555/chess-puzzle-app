import React, { useEffect } from "react";
import Animated, {
    Easing,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    cancelAnimation,
} from "react-native-reanimated";

type Props = {
    visible?: boolean;
};

const DOT_COUNT = 4;

export default function ThinkingDots({ visible = true }: Props) {


    const progress = useSharedValue(0);
    const visibilityProgress = useSharedValue(50);
    const opacityAnim = useSharedValue(0);

    const visibilityProgressStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateY: visibilityProgress.value,
            }],
            opacity: opacityAnim.value
        };
    })

    useEffect(() => {
        progress.value = 0;

        progress.value = withRepeat(
            withTiming(1, {
                duration: 1200,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        return () => {
            cancelAnimation(progress);
            progress.value = 0;
        };
    }, []);


    useEffect(() => {

        if (visible) {

            visibilityProgress.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            });
            opacityAnim.value = withTiming(1, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            });
        }
        else {
            visibilityProgress.value = withTiming(50, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            });
            opacityAnim.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            });
        }
    }, [visible]);


    return (
        <Animated.View
            style={[{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: 0
            },
                visibilityProgressStyle
            ]
            }
        >
            {Array.from({ length: DOT_COUNT }).map((_, index) => (
                <Dot key={index} index={index} progress={progress} />
            ))}
        </Animated.View>
    );
}

function Dot({
    index,
    progress,
}: {
    index: number;
    progress: SharedValue<number>;
}) {
    const animatedStyle = useAnimatedStyle(() => {
        const segment = 1 / DOT_COUNT;

        const start = index * segment;
        const end = start + segment;

        let local = 0;

        if (progress.value >= start && progress.value < end) {
            local = (progress.value - start) / segment;
        }

        const riseAndFall = local < 0.5 ? local * 2 : (1 - local) * 2;

        return {
            transform: [
                {
                    translateY: -10 * riseAndFall,
                },
            ],
        };
    });




    return (
        <Animated.View
            style={[
                {
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#D5A94A",
                },
                animatedStyle,
            ]}
        />
    );
}