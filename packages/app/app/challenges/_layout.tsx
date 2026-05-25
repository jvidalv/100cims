import { Slot } from "expo-router";
import { FormattedMessage } from "react-intl";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { BlurredScreenHeader } from "@/components/ui/molecules";

/**
 * Shared chrome for /challenges/*: the blurred screen header carries the
 * "Challenges" title. Both Official and Community tab screens render below
 * this, inside the nested NativeTabs at challenges/(tabs)/_layout.tsx.
 *
 * The header is absolute-positioned so child screens' scroll content slides
 * behind the translucent bar — each tab's scroll view is responsible for
 * its own `paddingTop: BLURRED_SCREEN_HEADER_HEIGHT`.
 */
export default function ChallengesLayout() {
  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="Challenges" />
        </ThemedText>
      </BlurredScreenHeader>
      <Slot />
    </ThemedView>
  );
}
