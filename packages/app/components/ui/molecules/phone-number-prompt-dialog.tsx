import { Phone, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  LucideIcon,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";

interface PhoneNumberPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phoneNumber: string) => void;
  isSaving?: boolean;
}

export function PhoneNumberPromptDialog({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: PhoneNumberPromptDialogProps) {
  const intl = useIntl();
  const [visible, setVisible] = useState(isOpen);
  const [phoneNumber, setPhoneNumber] = useState("");
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setPhoneNumber("");
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

  const trimmed = phoneNumber.trim();
  const canSave = !isSaving && trimmed.length > 0;

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

            <View className="gap-4 px-5 pb-5 pt-8">
              <View className="items-center gap-3">
                <View className="size-14 items-center justify-center rounded-full bg-primary/10">
                  <LucideIcon
                    icon={Phone}
                    size={28}
                    color={Colors.light.primary}
                  />
                </View>
                <ThemedText className="text-center text-2xl font-bold tracking-tight">
                  <FormattedMessage defaultMessage="One more thing" />
                </ThemedText>
                <ThemedText className="text-center leading-relaxed text-muted-foreground">
                  <FormattedMessage defaultMessage="Leave us a phone number and we'll reach out about your order faster. Only we see it." />
                </ThemedText>
              </View>

              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Phone number" })}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />

              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => canSave && onSave(trimmed)}
                  disabled={!canSave}
                  className={
                    canSave
                      ? "items-center rounded bg-primary py-3.5"
                      : "items-center rounded bg-primary/40 py-3.5"
                  }
                >
                  <ThemedText className="font-semibold text-white">
                    <FormattedMessage defaultMessage="Save" />
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
