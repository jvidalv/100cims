import {
  Redirect,
  useGlobalSearchParams,
  useRouter,
} from "expo-router";
import { Camera, Check, Clock } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import {
  ActionRow,
  BlurredScreenHeader,
  BLURRED_SCREEN_HEADER_HEIGHT,
  PeopleList,
  SummitRatingFields,
} from "@/components/ui/molecules";
import { useMountains, useSummitPost } from "@/domains/mountain/mountain.api";
import { SUMMITS_KEY } from "@/domains/summit/summit.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useImagePicker } from "@/hooks/use-image-picker";
import { toLocalDateString } from "@/lib/dates";
import { logError } from "@/lib/log-error";
import { userKeys } from "@/lib/query-keys";

export default function SummitMountainScreen() {
  const intl = useIntl();
  const router = useRouter();
  // NOTE: useGlobalSearchParams, not useLocalSearchParams. Inside a NativeTabs
  // navigator that lives under [slug], eagerly-mounted tab screens don't
  // receive the dynamic [slug] via useLocalSearchParams — it stays undefined
  // until the user actually focuses the tab via the URL. useGlobalSearchParams
  // reads from the URL directly, so it works for both tab-bar taps and
  // in-page Link navigation.
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { mutateAsync, isPending } = useSummitPost(slug);
  const { data: mountains } = useMountains();
  const { data: user } = useUserMe();

  const {
    imageUri,
    imageBase64,
    isLoading: isLoadingImage,
    pickImage,
  } = useImagePicker({ logTag: "mountain/summit/image-pick" });

  const [date, setDate] = useState<Date>(new Date());
  const [familyFriendly, setFamilyFriendly] = useState<number | null>(null);
  const [dogFriendly, setDogFriendly] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<PeoplePickerUser[]>(
    user
      ? [
          {
            id: user?.id,
            fullName: getFullName(user) || "?",
            imageUrl: user?.imageUrl,
          },
        ]
      : [],
  );

  const mountain = mountains?.find((mountain) => slug === mountain.slug);

  // Tabs mount eagerly, so this screen can render before useMountains /
  // useUserMe have resolved. Distinguish loading (still pending, show
  // spinner), "not logged in" (redirect to /join), and "no such mountain"
  // (404). `isAuthenticated` disambiguates: when it's false we KNOW
  // `useUserMe` will never produce a user, so we short-circuit straight
  // to /join instead of spinning forever.
  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }
  if (!mountains || !user) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (!mountain) {
    return <Redirect href="/+not-found" />;
  }

  const submitDisabled = !date || !selectedUsers?.length || !mountain;

  const onSubmit = async () => {
    if (submitDisabled) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Missing information.",
        }),
      );
    }

    try {
      const result = await mutateAsync({
        date: toLocalDateString(date),
        image: imageBase64 ?? undefined,
        mountainId: mountain?.id,
        usersId: selectedUsers.map((user) => user.id),
        familyFriendly,
        dogFriendly,
        difficulty,
      });

      void queryClient.refetchQueries({
        queryKey: SUMMITS_KEY({ limit: 4 }),
      });
      void queryClient.refetchQueries({
        queryKey: SUMMITS_KEY({
          mountainId: mountain.id,
          limit: 100,
        }),
      });
      void queryClient.refetchQueries({
        queryKey: userKeys.summits(),
      });
      if (result?.summitId) {
        router.replace({
          pathname: "/user/summits/[summit]",
          params: { summit: result.summitId, from: "create" },
        });
      } else {
        router.back();
      }
    } catch (error) {
      logError(error, "mountain/summit/submit");
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again.",
        }),
      );
    }
  };

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="max-w-56 text-lg font-medium">
          {mountain.name}
        </ThemedText>
      </BlurredScreenHeader>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-40"
        contentContainerStyle={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6 px-6 pt-2">
          <View className="gap-2">
            <ThemedText className="text-lg font-semibold">
              <FormattedMessage defaultMessage="Date" />
            </ThemedText>
            <ThemedDateInput value={date} onDateValid={setDate} noFutureDates />
          </View>
          <View className="gap-2">
            <ThemedText className="text-lg font-semibold">
              <FormattedMessage defaultMessage="Summit photo" />
            </ThemedText>
            <TouchableOpacity
              onPress={pickImage}
              className="h-64 w-full items-center justify-center overflow-hidden rounded border-2 border-border bg-background"
            >
              {imageUri ? (
                <View className="relative size-full items-center justify-center">
                  <View className="absolute top-0 z-10 size-full">
                    <Image
                      source={{ uri: imageUri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        resizeMode: "center",
                      }}
                    />
                  </View>
                  <Image
                    blurRadius={12}
                    source={{ uri: imageUri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: 0.5,
                    }}
                  />
                </View>
              ) : (
                <View className="relative size-full items-center justify-center">
                  {mountain.imageUrl && (
                    <Image
                      source={{ uri: mountain.imageUrl }}
                      style={{
                        width: "100%",
                        height: "100%",
                        opacity: 0.4,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  <View className="absolute inset-0 items-center justify-center">
                    {isLoadingImage ? (
                      <ActivityIndicator className="opacity-50" />
                    ) : (
                      <LucideIcon
                        icon={Camera}
                        size={32}
                        strokeWidth={1.5}
                        color="white"
                      />
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View className="gap-3">
            <ThemedText className="text-lg font-semibold">
              <FormattedMessage defaultMessage="People" />
            </ThemedText>
            <PeopleList
              selected={selectedUsers}
              onChange={setSelectedUsers}
            />
          </View>
          <SummitRatingFields
            familyFriendly={familyFriendly}
            onFamilyFriendlyChange={setFamilyFriendly}
            dogFriendly={dogFriendly}
            onDogFriendlyChange={setDogFriendly}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
          />
          <View className="mt-6 pb-24">
            <ActionRow
              icon={Check}
              size="lg"
              intent="emerald"
              onPress={onSubmit}
              disabled={isPending}
              activeOpacity={0.85}
              iconOverride={isPending ? <ActivityIndicator /> : undefined}
            >
              <FormattedMessage defaultMessage="Summit" />
            </ActionRow>
            <ActionRow
              icon={Clock}
              size="lg"
              onPress={router.back}
              activeOpacity={0.85}
            >
              <FormattedMessage defaultMessage="I'll summit later" />
            </ActionRow>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
