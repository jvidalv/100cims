import { ReactNode, useEffect, useState } from "react";
import {
  Modal as RNModal,
  Pressable,
  View,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/atoms/icon";

export function useBottomDrawer(initialOpen: boolean = false) {
  return useState(initialOpen);
}

type BottomDrawerProps = {
  isOpen: boolean;
  height?: number;
  onRequestClose?: () => void;
  children: ReactNode;
};

export function BottomDrawer({
  isOpen,
  height = 300,
  onRequestClose,
  children,
}: BottomDrawerProps) {
  const [visible, setVisible] = useState(isOpen);

  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(height, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => setVisible(false), 300);
    }
  }, [isOpen, height, translateY, opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.value = gestureState.dy;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        onRequestClose?.();
      } else {
        translateY.value = withTiming(0, { duration: 300 });
      }
    },
  });

  if (!visible) return null;

  return (
    <RNModal animationType="none" visible transparent>
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute size-full bg-background/40"
          style={animatedOverlayStyle}
        >
          <Pressable className="size-full" onPress={onRequestClose} />
        </Animated.View>
        <Animated.View
          {...panResponder.panHandlers}
          style={animatedContainerStyle}
          className="relative min-h-44 rounded-t-2xl border border-border bg-background shadow-sm"
        >
          <TouchableOpacity
            onPress={onRequestClose}
            className="absolute -top-8 right-4"
          >
            <Icon
              name="xmark"
              animationSpec={{ effect: { type: "bounce" } }}
              size={18}
            />
          </TouchableOpacity>
          {children}
        </Animated.View>
      </View>
    </RNModal>
  );
}
