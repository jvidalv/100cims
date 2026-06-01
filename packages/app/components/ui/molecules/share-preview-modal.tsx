import * as Sharing from "expo-sharing";
import { Share2, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Modal, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { logError } from "@/lib/log-error";

interface Props {
  visible: boolean;
  imageUri: string | null;
  dialogTitle: string;
  onClose: () => void;
}

const BUTTON_SLIDE_DISTANCE = 120;
const BUTTON_ANIMATION_MS = 320;

export function SharePreviewModal({
  visible,
  imageUri,
  dialogTitle,
  onClose,
}: Props) {
  const intl = useIntl();
  const insets = useSafeAreaInsets();
  const [isSharing, setIsSharing] = useState(false);

  const translateY = useSharedValue(BUTTON_SLIDE_DISTANCE);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration: BUTTON_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: BUTTON_ANIMATION_MS });
    } else {
      translateY.value = BUTTON_SLIDE_DISTANCE;
      opacity.value = 0;
    }
  }, [visible, translateY, opacity]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleShare = async () => {
    if (!imageUri || isSharing) return;
    setIsSharing(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(imageUri, {
          mimeType: "image/jpeg",
          dialogTitle,
          UTI: "public.jpeg",
        });
      }
      onClose();
    } catch (error) {
      logError(error, "share-preview/share");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center p-4">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              resizeMode="contain"
              className="size-full"
            />
          ) : null}
        </View>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.85}
          style={{ top: insets.top + 12 }}
          className="absolute right-4 size-10 items-center justify-center rounded-full bg-white/15"
          accessibilityLabel={intl.formatMessage({ defaultMessage: "Close" })}
        >
          <LucideIcon icon={X} size={22} color="white" />
        </TouchableOpacity>

        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            buttonAnimatedStyle,
            { bottom: insets.bottom + 24 },
          ]}
          className="absolute left-0 right-0 items-center"
        >
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing || !imageUri}
            activeOpacity={0.85}
            className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-primary px-8"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {isSharing ? (
              <ActivityIndicator color="white" />
            ) : (
              <LucideIcon icon={Share2} size={22} color="white" />
            )}
            <ThemedText className="text-base font-bold text-white">
              <FormattedMessage defaultMessage="Share" />
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
