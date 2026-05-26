import { Camera, X } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Pressable, TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText, ThemedView } from "@/components/ui/atoms";
import { PlanCoverBackground } from "@/components/ui/molecules/plan-cover-background";
import { pickAndOptimizeImage } from "@/lib/images";

type Props = {
  /** URI for the preview — either a freshly-picked local URI or an
   *  existing http(s) URL when editing a plan with a cover already. */
  imagePreview: string | null;
  /** Called with `(uri, base64)` after a successful pick. */
  onPicked: (preview: string, base64: string) => void;
  /** Called when the user long-presses (or — in a future variant — taps a
   *  remove affordance). The form should send `null` for `imageUrl` at
   *  submit time so the column gets cleared. */
  onCleared: () => void;
  /** Plumbed into the right-side thumbnail so the empty state mirrors the
   *  row/detail fallback (mountain collage, or initials when no mountains
   *  are selected). */
  mountains?: { imageUrl?: string | null }[];
  /** Used for the initials fallback when neither a custom image nor any
   *  mountain image is available. */
  title: string;
};

/**
 * Row-shaped plan-cover picker. Matches `ThemedSwitch`'s outlined-row
 * visual: floating label + body text on the left, a small thumbnail on
 * the right. The thumbnail previews exactly what the plan list and
 * detail will render — custom image when set, else mountain collage,
 * else initials.
 *
 * Tap anywhere to pick a new photo. When one is set, a visible X button
 * clears it (long-press also works as a power-user shortcut).
 */
export const PlanCoverPicker = ({
  imagePreview,
  onPicked,
  onCleared,
  mountains,
  title,
}: Props) => {
  const intl = useIntl();

  const pick = async () => {
    try {
      // Match the dominant render surface (square thumbnails in the list
      // rows and the picker preview) so the user's crop is what they see.
      // The parallax header on the detail screen is wider than tall, so
      // it'll center-crop a strip off the edges — acceptable tradeoff
      // against the previous 16:9 that lost top/bottom in every list row.
      const result = await pickAndOptimizeImage({ aspect: [1, 1] });
      if (!result?.optimized.base64) return;
      onPicked(result.picked.uri, result.optimized.base64);
    } catch {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Could not load image, try another one.",
        }),
      );
    }
  };

  const confirmClear = () => {
    if (!imagePreview) return;
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Remove cover photo?" }),
      intl.formatMessage({
        defaultMessage: "The plan will fall back to its mountain images.",
      }),
      [
        { text: intl.formatMessage({ defaultMessage: "Cancel" }), style: "cancel" },
        {
          text: intl.formatMessage({ defaultMessage: "Remove" }),
          style: "destructive",
          onPress: onCleared,
        },
      ],
    );
  };

  const label = intl.formatMessage({ defaultMessage: "Cover photo" });
  return (
    <Pressable
      onPress={pick}
      onLongPress={confirmClear}
      accessibilityLabel={intl.formatMessage({
        defaultMessage: "Pick a cover photo",
      })}
      className="flex-row items-center justify-between gap-3 rounded border-2 border-border px-4 py-3"
    >
      <ThemedView className="absolute -top-3 left-4 z-10 -mx-1 bg-background px-1">
        <ThemedText
          className="text-muted-foreground"
          style={{ fontSize: 14, lineHeight: 15 }}
        >
          {label}
        </ThemedText>
      </ThemedView>
      <View className="flex-1 flex-row items-center gap-2">
        <LucideIcon icon={Camera} size={18} muted />
        <ThemedText className="text-muted-foreground">
          {imagePreview ? (
            <FormattedMessage defaultMessage="Tap to replace" />
          ) : (
            <FormattedMessage defaultMessage="Tap to add (optional)" />
          )}
        </ThemedText>
      </View>
      {imagePreview && (
        <TouchableOpacity
          accessibilityLabel={intl.formatMessage({
            defaultMessage: "Remove cover photo",
          })}
          hitSlop={8}
          onPress={confirmClear}
          className="size-8 items-center justify-center rounded-full bg-muted"
        >
          <LucideIcon icon={X} size={16} muted />
        </TouchableOpacity>
      )}
      <View className="size-12 overflow-hidden rounded">
        <PlanCoverBackground
          customImageUrl={imagePreview}
          mountains={mountains}
          title={title}
          withBottomGradient={false}
          initialsSize="sm"
        />
      </View>
    </Pressable>
  );
};
