import { Bell, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";

interface PushPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
}

export function PushPermissionDialog({
  isOpen,
  onClose,
  onEnable,
}: PushPermissionDialogProps) {
  const [visible, setVisible] = useState(isOpen);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
      return;
    }
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.9, { duration: 150 });
    const hideTimer = setTimeout(() => setVisible(false), 150);
    return () => clearTimeout(hideTimer);
  }, [isOpen, opacity, scale]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      visible
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              zIndex: 0,
            },
            animatedOverlayStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[animatedContentStyle, { zIndex: 1 }]}
          className="w-full max-w-md px-4"
        >
          <ThemedView className="overflow-hidden rounded-3xl border border-border">
            <View className="absolute right-3 top-3 z-10">
              <TouchableOpacity
                onPress={onClose}
                className="size-8 items-center justify-center rounded-full bg-muted"
              >
                <LucideIcon icon={X} size={16} muted />
              </TouchableOpacity>
            </View>

            <View className="items-center gap-4 px-5 pb-5 pt-8">
              <View className="size-14 items-center justify-center rounded-full bg-primary/10">
                <LucideIcon
                  icon={Bell}
                  size={28}
                  color={Colors.light.primary}
                />
              </View>

              <ThemedText className="text-center text-2xl font-bold tracking-tight">
                <FormattedMessage defaultMessage="Stay in the loop" />
              </ThemedText>

              <ThemedText className="text-center leading-relaxed text-muted-foreground">
                <FormattedMessage defaultMessage="We'll ping you when friends join your plans, tag you in summits, or comment in chat. That's it — nothing else." />
              </ThemedText>

              <View className="mt-2 w-full gap-2">
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onEnable();
                  }}
                  className="items-center rounded bg-primary py-3.5"
                >
                  <ThemedText className="font-semibold text-white">
                    <FormattedMessage defaultMessage="Enable notifications" />
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  className="items-center py-3"
                >
                  <ThemedText className="font-medium text-muted-foreground">
                    <FormattedMessage defaultMessage="Not now" />
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}
