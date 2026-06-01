import { useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedTextInput,
} from "@/components/ui/atoms";
import { ActionRow, ScreenHeader } from "@/components/ui/molecules";
import { useSubmitSuggestionMutation } from "@/domains/user/user.api";

// Escape hatch from the Bizum payment step. Buyers who can't pay via
// Bizum (no banking app, foreign account, confused) write us a message
// here. We reuse the existing /api/protected/user/suggestion endpoint
// with a `[BIZUM HELP]` prefix so the message lands in Discord/Sheets
// alongside other inbound feedback — no new backend infra.
const BIZUM_HELP_PREFIX = "[BIZUM HELP]";

export default function ShopHelpScreen() {
  const intl = useIntl();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mutateAsync: submitSuggestion, isPending } =
    useSubmitSuggestionMutation();
  const [message, setMessage] = useState("");

  const onSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await submitSuggestion({
        suggestion: `${BIZUM_HELP_PREFIX}\n${trimmed}`,
      });
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Thanks, we'll be in touch." }),
      );
      router.replace("/shop");
    } catch {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    }
  };

  return (
    <ThemedKeyboardAvoidingView>
      <ScreenHeader>
        <FormattedMessage defaultMessage="Need help?" />
      </ScreenHeader>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Tell us what's stuck — Bizum problems, payment failed, anything else. We'll get back to you within a day." />
        </ThemedText>
        <ThemedTextInput
          label={intl.formatMessage({ defaultMessage: "Message" })}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1500}
          inputClassName="min-h-32"
        />
        <ActionRow
          icon={Send}
          intent="primary"
          size="lg"
          onPress={onSend}
          disabled={isPending || message.trim().length === 0}
        >
          {isPending ? (
            <FormattedMessage defaultMessage="Sending…" />
          ) : (
            <FormattedMessage defaultMessage="Send" />
          )}
        </ActionRow>
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}
