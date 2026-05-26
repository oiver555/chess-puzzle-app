import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import Piece from "./Piece";

export default function AnimatedPiece({ code, x, y, size }: any) {
  const translateX = useSharedValue(x);
  const translateY = useSharedValue(y);

  useEffect(() => {
    translateX.value = withTiming(x, { duration: 220 });
    translateY.value = withTiming(y, { duration: 220 });
  }, [x, y]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        },
        animatedStyle,
      ]}
    >
      <Piece code={code} size={40} />
    </Animated.View>
  );
}