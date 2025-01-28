import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { View } from "react-native";

import {
  Button,
  Icon,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export default function AboutTheAppScreen() {
  const intl = useIntl();
  const api = useApiWithAuth();
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummited, setIsSummited] = useState(false);

  const onSubmit = async () => {
    try {
      setIsSummited(false);
      setIsLoading(true);
      await api.protected.user.suggestion.post({ suggestion });
      setIsSummited(true);
      setSuggestion("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="flex-1 px-6">
        <ThemedText className="mb-8 text-4xl font-bold">
          <FormattedMessage defaultMessage="Suggestions" />
        </ThemedText>
        <ThemedTextInput
          className="mb-6"
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
          isLoading={isLoading}
        >
          <FormattedMessage defaultMessage="Share" />
        </Button>
        {isSummited && (
          <View className="flex flex-row items-center gap-2">
            <Icon name="checkmark.seal.fill" color="#10b981" />
            <ThemedText className="font-medium text-emerald-500">
              <FormattedMessage defaultMessage="Received, thanks for your suggestion!" />
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}
