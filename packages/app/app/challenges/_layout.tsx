import { Slot } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";

/**
 * Shared chrome for /challenges/*: the screen header (back button) and the
 * page title. Both Official and Community tab screens render below this,
 * inside the nested NativeTabs at challenges/(tabs)/_layout.tsx.
 */
export default function ChallengesLayout() {
  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mx-6 mb-2">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="Challenges" />
        </ThemedText>
      </View>
      <Slot />
    </ThemedView>
  );
}
