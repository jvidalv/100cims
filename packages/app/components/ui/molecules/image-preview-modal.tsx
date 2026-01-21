import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ImageSourcePropType,
  Modal,
} from "react-native";
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/atoms";

interface ImagePreviewModalProps {
  visible: boolean;
  imageSource: ImageSourcePropType | null;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export function ImagePreviewModal({
  visible,
  imageSource,
  onClose,
}: ImagePreviewModalProps) {
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

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      // Clamp scale between MIN_SCALE and MAX_SCALE
      scale.value = Math.min(Math.max(newScale, MIN_SCALE * 0.5), MAX_SCALE);
    })
    .onEnd(() => {
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
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        resetZoom();
      } else {
        scale.value = withTiming(3);
        savedScale.value = 3;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 items-center justify-center bg-black/95">
          <TouchableOpacity
            className="absolute right-4 top-[15%] z-10"
            onPress={handleClose}
          >
            <Icon name="xmark" size={20} color="white" weight="semibold" />
          </TouchableOpacity>
          {imageSource && (
            <GestureDetector gesture={composedGesture}>
              <Animated.Image
                source={imageSource}
                className="h-[70%] w-full"
                resizeMode="contain"
                style={animatedImageStyle}
              />
            </GestureDetector>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Hook to manage image preview state
export function useImagePreview() {
  const [previewImage, setPreviewImage] = useState<ImageSourcePropType | null>(null);

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
