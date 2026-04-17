import { useRouter, Redirect } from "expo-router";
import { Check, Info, X } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  ChallengeForm,
  ChallengeFormData,
} from "@/components/forms/challenge-form";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  ChallengeMountainList,
  ScreenHeader,
} from "@/components/ui/molecules";
import {
  toInlineMountain,
  useCommunityChallengeCreate,
} from "@/domains/community-challenge/community-challenge.api";
import { useMountainSelection } from "@/hooks/use-mountain-selection";
import { isAndroid } from "@/lib/device";

export default function CommunityChallengeCreatePage() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<ChallengeFormData>({
    name: "",
    country: "",
    description: "",
    isPublic: false,
  });

  const {
    selected,
    newMountains,
    totalMountainCount,
    handlePickerResult,
  } = useMountainSelection();

  const handleFormChange = (next: ChallengeFormData) => {
    if (next.isPublic && !formData.isPublic && totalMountainCount < 1) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Add at least one mountain before making it public",
        }),
      );
      return;
    }
    setFormData(next);
  };

  const { mutateAsync, isPending } = useCommunityChallengeCreate();

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Name is required",
        }),
      );
    }

    if (!formData.country.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Country/Region is required",
        }),
      );
    }

    if (totalMountainCount < 1) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "At least one mountain is required",
        }),
      );
    }

    try {
      await mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country: formData.country.trim(),
        isPublic: formData.isPublic,
        mountainIds:
          selected.length > 0 ? selected.map((m) => m.id) : undefined,
        newMountains:
          newMountains.length > 0
            ? newMountains.map(toInlineMountain)
            : undefined,
      });

      router.dismiss();
    } catch {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Something went wrong, try again later!",
        }),
      );
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className={twMerge("px-6 pb-4", isAndroid && "pt-16")}>
          <ThemedText className="text-4xl font-semibold">
            <FormattedMessage defaultMessage="New challenge" />
          </ThemedText>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-12 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <ChallengeForm data={formData} onChange={handleFormChange}>
            <View className="gap-3">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
                <ThemedText className="text-destructive"> *</ThemedText>
              </ThemedText>
              <ChallengeMountainList
                selected={selected}
                newMountains={newMountains}
                onChange={handlePickerResult}
              />
              <View className="flex-row items-center gap-2">
                <LucideIcon icon={Info} size={16} color="#3b82f6" />
                <ThemedText className="flex-1 text-sm text-blue-500">
                  <FormattedMessage defaultMessage="You can add or remove mountains later" />
                </ThemedText>
              </View>
            </View>
          </ChallengeForm>
          <View className="mt-6 px-6">
            <ActionRow
              icon={Check}
              size="lg"
              intent="emerald"
              onPress={handleCreate}
              disabled={isPending}
              activeOpacity={0.85}
              iconOverride={isPending ? <ActivityIndicator /> : undefined}
            >
              <FormattedMessage defaultMessage="Create challenge" />
            </ActionRow>
            <ActionRow
              icon={X}
              size="lg"
              onPress={() => router.dismiss()}
              activeOpacity={0.85}
            >
              <FormattedMessage defaultMessage="Cancel" />
            </ActionRow>
          </View>
        </ScrollView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}
