import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useEffect, useState } from "react";
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
  BlurView,
  Button,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ChallengeMountainList,
  ScreenHeader,
} from "@/components/ui/molecules";
import {
  toInlineMountain,
  useCommunityChallengeDetail,
  useCommunityChallengeUpdate,
} from "@/domains/community-challenge/community-challenge.api";
import { isCreator } from "@/domains/community-challenge/community-challenge.model";
import { toPickerMountain } from "@/domains/mountain/mountain-picker-session";
import { useUserMe } from "@/domains/user/user.api";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { useMountainSelection } from "@/hooks/use-mountain-selection";
import { isAndroid } from "@/lib/device";

export default function CommunityChallengeEditPage() {
  const router = useRouter();
  const intl = useIntl();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const isKeyboardVisible = useIsKeyboardVisible();

  const { data: challenge, isLoading } = useCommunityChallengeDetail(
    { id: id! },
    { enabled: !!id },
  );

  const [formData, setFormData] = useState<ChallengeFormData | null>(null);

  const {
    selected,
    newMountains,
    totalMountainCount,
    handlePickerResult,
    initializeFromChallenge,
  } = useMountainSelection();

  const { mutateAsync, isPending } = useCommunityChallengeUpdate();

  const isOwner = isCreator(challenge?.creatorId, user?.id);

  useEffect(() => {
    if (challenge && !formData) {
      setFormData({
        name: challenge.name,
        country: challenge.country,
        description: challenge.description || "",
        isPublic: challenge.isPublic,
      });
      initializeFromChallenge(challenge.mountains.map(toPickerMountain));
    }
  }, [challenge, formData, initializeFromChallenge]);

  const handleUpdate = async () => {
    if (!formData) return;

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
        id: id!,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country: formData.country.trim(),
        isPublic: formData.isPublic,
        mountainIds: selected.map((m) => m.id),
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

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!challenge || !isOwner || !formData) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        {!isLoading && !challenge ? (
          <ThemedText>
            <FormattedMessage defaultMessage="Not authorized" />
          </ThemedText>
        ) : (
          <ActivityIndicator />
        )}
      </ThemedView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-40"
          keyboardShouldPersistTaps="handled"
        >
          <View className={twMerge("px-6 pt-2 pb-4", isAndroid && "pt-24")}>
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Edit challenge" />
            </ThemedText>
            <ThemedText className="text-4xl font-semibold">
              {challenge.name}
            </ThemedText>
          </View>

          <ChallengeForm data={formData} onChange={setFormData}>
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
            </View>
          </ChallengeForm>
        </ScrollView>

        <BlurView
          className={twMerge(
            "px-6 pt-1 pb-8",
            isKeyboardVisible && "opacity-0",
          )}
        >
          <Button isLoading={isPending} onPress={handleUpdate}>
            <FormattedMessage defaultMessage="Save changes" />
          </Button>
          <Button
            intent="ghost"
            onPress={() => router.dismiss()}
            textClassName="text-muted-foreground"
          >
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
        </BlurView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}
