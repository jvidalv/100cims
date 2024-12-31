import {
  Dispatch,
  Fragment,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import {
  Modal as RNModal,
  Pressable,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon } from "@/components/ui/atoms";

export function BottomDrawer({
  onRequestClose,
  children,
  Trigger,
}: {
  onRequestClose?: () => void;
  children: (props: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
  }) => ReactNode;
  Trigger: ({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
  }) => ReactNode;
}) {
  const [innerOpen, setInnerOpen] = useState(false);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(innerOpen ? 1 : 0);

  // Update opacity when `innerOpen` changes
  useEffect(() => {
    if (innerOpen) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(300, { duration: 300 });
      opacity.value = withTiming(0, { duration: 50 });
    }
  }, [innerOpen, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
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
        setInnerOpen(false);
      } else {
        translateY.value = withTiming(0, { duration: 300 });
      }
    },
  });

  return (
    <Fragment>
      <RNModal
        animationType="slide"
        visible={innerOpen}
        transparent
        onRequestClose={onRequestClose}
      >
        <View className="flex-1 justify-end">
          <Animated.View
            className="absolute size-full bg-background/40"
            style={backgroundStyle}
          >
            <Pressable
              onPress={() => setInnerOpen(false)}
              className="size-full"
            />
          </Animated.View>
          <Animated.View
            {...panResponder.panHandlers}
            style={animatedStyle}
            className="relative -mx-px min-h-64 rounded-t-2xl border border-border bg-background shadow-sm"
          >
            <TouchableOpacity
              onPress={() => setInnerOpen(false)}
              className="absolute -top-8 right-4"
            >
              <Icon
                name="xmark"
                animationSpec={{ effect: { type: "bounce" } }}
                size={18}
              />
            </TouchableOpacity>
            {children({ open: innerOpen, setOpen: setInnerOpen })}
          </Animated.View>
        </View>
      </RNModal>
      <Trigger open={innerOpen} setOpen={setInnerOpen} />
    </Fragment>
  );
}
