import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import {
  Modal,
  Pressable,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon, ThemedText, ThemedView } from "@/components/ui/atoms";

export interface Update {
  id: string;
  title: string;
  date: string;
  body: string;
  imageUrl: string;
}

interface UpdatesDialogProps {
  update: Update;
  isOpen: boolean;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function UpdatesDialog({
  update,
  isOpen,
  onClose,
  actionLabel,
  onAction,
}: UpdatesDialogProps) {
  const intl = useIntl();
  const [visible, setVisible] = useState(isOpen);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      setTimeout(() => setVisible(false), 150);
    }
  }, [isOpen, opacity, scale]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const formattedDate = intl.formatDate(new Date(update.date), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!visible) return null;

  return (
    <Modal animationType="none" visible transparent statusBarTranslucent>
      <View className="flex-1 items-center justify-center">
        <Animated.View
          className="absolute size-full bg-black/60"
          style={animatedOverlayStyle}
        >
          <Pressable className="size-full" onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={animatedContentStyle}
          className="w-full max-w-md px-4"
        >
          <ThemedView className="overflow-hidden rounded-3xl border border-border">
            {/* Image */}
            <Image
              source={{ uri: update.imageUrl }}
              className="h-48 w-full"
              resizeMode="cover"
            />
            {/* Close button */}
            <View className="absolute right-3 top-3">
              <TouchableOpacity
                onPress={onClose}
                className="size-8 items-center justify-center rounded-full bg-black/40"
              >
                <Icon name="xmark" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="gap-2.5 p-4">
              {/* Date badge */}
              <View className="flex-row">
                <ThemedText className="text-sm font-medium text-primary">
                  {formattedDate}
                </ThemedText>
              </View>

              {/* Title */}
              <ThemedText className="text-2xl font-bold tracking-tight">
                {update.title}
              </ThemedText>

              {/* Body */}
              <ScrollView
                className="max-h-40"
                showsVerticalScrollIndicator={false}
              >
                <ThemedText className="leading-relaxed text-muted-foreground">
                  {update.body}
                </ThemedText>
              </ScrollView>

              {/* Action button */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onAction?.();
                }}
                className="mt-2 items-center rounded-xl bg-primary py-3.5"
              >
                <ThemedText className="font-semibold text-white">
                  {actionLabel || intl.formatMessage({ defaultMessage: "Got it!" })}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}
