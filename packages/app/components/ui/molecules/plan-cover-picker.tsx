import { Camera, X } from "lucide-react-native";
import { useIntl } from "react-intl";
import { Alert, Pressable, TouchableOpacity, View } from "react-native";

import { LucideIcon } from "@/components/ui/atoms";
import { PlanCoverBackground } from "@/components/ui/molecules/plan-cover-background";
import { pickAndOptimizeImage } from "@/lib/images";

type Props = {
  /** URI for the preview — either a freshly-picked local URI or an
   *  existing http(s) URL when editing a plan with a cover already. */
  imagePreview: string | null;
  /** Called with `(uri, base64)` after a successful pick. */
  onPicked: (preview: string, base64: string) => void;
  /** Called when the user clears the photo. The form should send `null`
   *  for `imageUrl` at submit time so the column gets cleared. */
  onCleared: () => void;
  /** Selected mountains for the cover-background fallback. Mirrors the
   *  render order used on the plan-detail header: customImageUrl ›
   *  mountain collage › initials. */
  mountains?: { imageUrl?: string | null }[];
  /** Title used by `PlanCoverBackground` for the initials fallback. */
  title: string;
};

/**
 * Full-width plan-cover picker. Shows the same `PlanCoverBackground` the
 * plan-detail header uses, so the user sees the exact preview they'll get
 * downstream: picked photo › collage of selected-mountain images ›
 * initials over the brand background. Tap anywhere to pick or replace; a
 * small X in the corner clears the picked photo (the picker then falls
 * back to the collage or initials).
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
      // Square crop matches the dominant render surface (square thumbnails
      // in the list rows and on this picker) so the user sees the same
      // crop they'll get on every other surface.
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

  const a11yLabel = imagePreview
    ? intl.formatMessage({ defaultMessage: "Replace cover photo" })
    : intl.formatMessage({ defaultMessage: "Pick a cover photo" });

  return (
    <Pressable
      onPress={pick}
      accessibilityLabel={a11yLabel}
      // h-32 = 128px — same vertical heft as a parallax header preview at a
      // glance. Rounded + overflow-hidden so the background fills cleanly
      // up to the rounded corners. `mb-3` adds a little breathing room
      // beyond the form's default 24px gap so the title input doesn't
      // crowd the picker.
      className="relative mb-3 h-32 w-full items-center justify-center overflow-hidden rounded"
    >
      <View className="absolute inset-0">
        <PlanCoverBackground
          customImageUrl={imagePreview}
          mountains={mountains}
          title={title}
          withBottomGradient={false}
        />
      </View>
      {/* Translucent disc keeps the camera icon legible against any
          background (custom photo, collage, or the brand-color initials). */}
      <View className="size-12 items-center justify-center rounded-full bg-black/45">
        <LucideIcon icon={Camera} size={22} color="#ffffff" />
      </View>
      {imagePreview && (
        <TouchableOpacity
          accessibilityLabel={intl.formatMessage({
            defaultMessage: "Remove cover photo",
          })}
          hitSlop={8}
          onPress={confirmClear}
          className="absolute right-2 top-2 size-7 items-center justify-center rounded-full bg-black/55"
        >
          <LucideIcon icon={X} size={14} color="#ffffff" />
        </TouchableOpacity>
      )}
    </Pressable>
  );
};
