import { BadgeCheck } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { View } from "react-native";


import {
  Button,
  LucideIcon,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import {
  useBlurredScreenHeaderHeight,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import { useSubmitSuggestionMutation } from "@/domains/user/user.api";

export default function SuggestionsScreen() {
  const intl = useIntl();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { mutateAsync: submitSuggestion, isPending } =
    useSubmitSuggestionMutation();
  const [suggestion, setSuggestion] = useState("");
  const [isSummited, setIsSummited] = useState(false);

  const onSubmit = async () => {
    try {
      setIsSummited(false);
      await submitSuggestion({ suggestion });
      setIsSummited(true);
      setSuggestion("");
    } catch {
      // Handle error silently
    }
  };

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="Help & Suggestions" />
        </ThemedText>
      </BlurredScreenHeader>
      <View
        className="flex-1 px-6"
        style={{ paddingTop: blurredHeaderHeight }}
      >
        <ThemedTextInput
          className="mb-6"
          inputClassName="h-[220px]"
          autoFocus
          multiline
          value={suggestion}
          onChangeText={setSuggestion}
          label={intl.formatMessage({
            defaultMessage: "Share your ideas to improve the app!",
          })}
        />
        <Button
          className="mb-4"
          disabled={!suggestion}
          onPress={onSubmit}
          isLoading={isPending}
        >
          <FormattedMessage defaultMessage="Share" />
        </Button>
        {isSummited && (
          <View className="flex flex-row items-center gap-2">
            <LucideIcon icon={BadgeCheck} color="#10b981" />
            <ThemedText className="font-medium text-emerald-500">
              <FormattedMessage defaultMessage="Received, thanks for your suggestion!" />
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}
