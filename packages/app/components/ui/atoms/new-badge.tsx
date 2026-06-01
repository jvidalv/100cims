import { FormattedMessage } from "react-intl";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/atoms/themed-text";

// Small blue pill used wherever we want to highlight a newly added shop
// product. Blue (`bg-blue-500`) intentionally differs from the brand rose
// used by cart count + featured so "New" reads as its own category.
export const NewBadge = () => {
  return (
    <View className="rounded-full bg-blue-500 px-2 py-0.5">
      <ThemedText className="text-xs font-bold text-white">
        <FormattedMessage defaultMessage="New" />
      </ThemedText>
    </View>
  );
};
