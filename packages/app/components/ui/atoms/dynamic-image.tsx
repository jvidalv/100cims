import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { BlurView } from "@/components/ui/atoms/blur-view";
import { Skeleton } from "@/components/ui/atoms/skeleton";

const MIN_SCALE = 1;
const MAX_SCALE = 2.5;

export const DynamicImage = ({
  uri,
  onClose,
}: {
  uri: string;
  onClose?: () => void;
}) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => setSize({ width, height }),
      (error) => console.warn("Failed to get image size", error),
    );
  }, [uri]);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reanimated SharedValue refs are stable
  }, [uri]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE * 0.8), MAX_SCALE);
    })
    .onEnd(() => {
      "worklet";
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
        savedScale.value = MAX_SCALE;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      "worklet";
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      "worklet";
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      "worklet";
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const backdropTap = Gesture.Tap().onEnd(() => {
    "worklet";
    if (onClose) runOnJS(onClose)();
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  if (!size) return <Skeleton className="size-full min-h-[500px]" />;

  const aspectRatio = size.width / size.height;
  const fitByWidth = screenWidth / aspectRatio <= screenHeight;
  const displayWidth = fitByWidth ? screenWidth : screenHeight * aspectRatio;
  const displayHeight = fitByWidth ? screenWidth / aspectRatio : screenHeight;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={backdropTap}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.75)" },
            ]}
          />
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                { width: displayWidth, height: displayHeight },
                animatedStyle,
              ]}
            >
              <Image
                source={{ uri }}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                }}
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
