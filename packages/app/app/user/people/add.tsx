import { FormattedMessage } from "react-intl";
import { View } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";

export default function AddPeopleScreen() {
  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="px-6">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="Add people" />
        </ThemedText>
      </View>
    </ThemedView>
  );
}
