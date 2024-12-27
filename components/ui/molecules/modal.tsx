import {
  Dispatch,
  Fragment,
  PropsWithChildren,
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
} from "react-native";
import { Icon, ThemedView } from "@/components/ui/atoms";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function Modal({
  onRequestClose,
  children,
  Trigger,
}: PropsWithChildren<{
  onRequestClose?: () => void;
  Trigger: ({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
  }) => ReactNode;
}>) {
  const [innerOpen, setInnerOpen] = useState(false);

  const opacity = useSharedValue(innerOpen ? 1 : 0);

  // Update opacity when `innerOpen` changes
  useEffect(() => {
    opacity.value = withTiming(innerOpen ? 1 : 0, {
      duration: innerOpen ? 500 : 0,
    });
  }, [innerOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
            className="absolute bg-background/40 h-full w-full"
            style={animatedStyle}
          >
            <Pressable
              onPress={() => setInnerOpen(false)}
              className="h-full w-full"
            />
          </Animated.View>
          <ThemedView className="-mx-[1px] shadow-sm relative p-6 min-h-64 rounded-t-2xl border border-border">
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
            {children}
          </ThemedView>
        </View>
      </RNModal>
      <Trigger open={innerOpen} setOpen={setInnerOpen} />
    </Fragment>
  );
}
