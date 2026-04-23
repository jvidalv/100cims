import { X } from "lucide-react-native";
import { type ReactNode, useEffect, useState } from "react";
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


import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";

export interface Update {
  id: string;
  title: string;
  body: string | ReactNode;
  /** ISO date shown as a small badge above the title. Omit for evergreen info. */
  date?: string;
  /** Header image. Omit for text-only dialogs. */
  imageUrl?: string | number;
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

  const formattedDate = update.date
    ? intl.formatDate(new Date(update.date), {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

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
            {/* Image */}
            {update.imageUrl !== undefined && (
              <Image
                source={
                  typeof update.imageUrl === "number"
                    ? update.imageUrl
                    : { uri: update.imageUrl }
                }
                className="h-48 w-full"
                resizeMode="cover"
              />
            )}
            {/* Close button */}
            <View className="absolute right-3 top-3">
              <TouchableOpacity
                onPress={onClose}
                className="size-8 items-center justify-center rounded-full bg-black/40"
              >
                <LucideIcon icon={X} size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View
              className={
                update.imageUrl !== undefined
                  ? "gap-2.5 p-4"
                  : "gap-2.5 p-4 pr-12"
              }
            >
              {/* Date badge */}
              {formattedDate && (
                <View className="flex-row">
                  <ThemedText className="text-sm font-medium text-primary">
                    {formattedDate}
                  </ThemedText>
                </View>
              )}

              {/* Title */}
              <ThemedText className="text-2xl font-bold tracking-tight">
                {update.title}
              </ThemedText>

              {/* Body */}
              <ScrollView
                className="max-h-60"
                showsVerticalScrollIndicator={false}
              >
                {typeof update.body === "string" ? (
                  <ThemedText className="leading-relaxed text-muted-foreground">
                    {update.body}
                  </ThemedText>
                ) : (
                  update.body
                )}
              </ScrollView>

              {/* Action button */}
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onAction?.();
                }}
                className="mt-2 items-center rounded bg-primary py-3.5"
              >
                <ThemedText className="font-semibold text-white">
                  {actionLabel ||
                    intl.formatMessage({ defaultMessage: "Got it!" })}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}
