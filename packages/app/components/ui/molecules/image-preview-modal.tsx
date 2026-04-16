import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { BlurView, LucideIcon } from "@/components/ui/atoms";

interface ImagePreviewModalProps {
  visible: boolean;
  imageSource: ImageSourcePropType | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const getSourceSize = (
  source: ImageSourcePropType,
): { width: number; height: number } | null => {
  const resolved = Image.resolveAssetSource(source);
  if (resolved?.width && resolved?.height) {
    return { width: resolved.width, height: resolved.height };
  }
  return null;
};

export function ImagePreviewModal({
  visible,
  imageSource,
  onClose,
}: ImagePreviewModalProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  const sourceKey =
    imageSource == null
      ? null
      : typeof imageSource === "number"
        ? String(imageSource)
        : typeof imageSource === "object" && "uri" in imageSource
          ? (imageSource.uri ?? null)
          : null;

  useEffect(() => {
    if (!imageSource) {
      setSize(null);
      return;
    }
    const resolved = getSourceSize(imageSource);
    if (resolved) {
      setSize(resolved);
      return;
    }
    const uri =
      typeof imageSource === "object" && "uri" in imageSource
        ? imageSource.uri
        : undefined;
    if (!uri) {
      setSize(null);
      return;
    }
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled) setSize({ width, height });
      },
      () => {
        if (!cancelled) setSize(null);
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sourceKey is the stable identity of imageSource
  }, [sourceKey]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      const newScale = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE * 0.5), MAX_SCALE);
    })
    .onEnd(() => {
      "worklet";
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        savedScale.value = MIN_SCALE;
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
        runOnJS(resetZoom)();
      } else {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    });

  const imageGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const backdropTap = Gesture.Tap().onEnd(() => {
    "worklet";
    runOnJS(handleClose)();
  });

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const aspectRatio = size ? size.width / size.height : 1;
  const fitByWidth = size ? screenWidth / aspectRatio <= screenHeight : true;
  const displayWidth = size
    ? fitByWidth
      ? screenWidth
      : screenHeight * aspectRatio
    : 0;
  const displayHeight = size
    ? fitByWidth
      ? screenWidth / aspectRatio
      : screenHeight
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={backdropTap}>
          <View className="flex-1 items-center justify-center">
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(0,0,0,0.65)" },
              ]}
            />
            {imageSource && size && (
              <GestureDetector gesture={imageGesture}>
                <Animated.View
                  style={[
                    { width: displayWidth, height: displayHeight },
                    animatedImageStyle,
                  ]}
                >
                  <Image
                    source={imageSource}
                    style={{ width: "100%", height: "100%" }}
                  />
                </Animated.View>
              </GestureDetector>
            )}
            <TouchableOpacity
              className="absolute right-4 top-[15%] z-10"
              onPress={handleClose}
            >
              <LucideIcon icon={X} size={20} color="white" />
            </TouchableOpacity>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function useImagePreview() {
  const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(
    null,
  );

  const openPreview = (image: ImageSourcePropType) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return {
    previewImage,
    isPreviewOpen: !!previewImage,
    openPreview,
    closePreview,
  };
}
