import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Check, X } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";


import {
  ActivityIndicator,
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import {
  ActionRow,
  PeopleList,
  ScreenHeader,
  SummitRatingFields,
} from "@/components/ui/molecules";
import {
  useSummitGet,
  useUpdateSummitMutation,
} from "@/domains/summit/summit.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useImagePicker } from "@/hooks/use-image-picker";
import { parseLocalDateString, toLocalDateString } from "@/lib/dates";
import { logError } from "@/lib/log-error";

export default function EditSummitScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { summit } = useLocalSearchParams<{ summit: string }>();
  const { data } = useSummitGet({ summitId: summit });
  const { data: me } = useUserMe();
  const { mutateAsync, isPending } = useUpdateSummitMutation();

  const {
    imageUri: pickedUri,
    imageBase64,
    isLoading: isLoadingImage,
    pickImage,
  } = useImagePicker({ logTag: "summit/edit/image-pick" });
  const [date, setDate] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<
    PeoplePickerUser[] | null
  >(null);
  // Rating fields: undefined = untouched (falls back to server value),
  // null = explicitly cleared, number = new value.
  const [familyFriendly, setFamilyFriendly] = useState<
    number | null | undefined
  >(undefined);
  const [dogFriendly, setDogFriendly] = useState<number | null | undefined>(
    undefined,
  );
  const [difficulty, setDifficulty] = useState<number | null | undefined>(
    undefined,
  );

  if (!data || !me) {
    return (
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className="gap-6 px-6 pt-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </View>
      </ThemedView>
    );
  }

  const initialDate = parseLocalDateString(data.summitedAt);
  const initialUsers: PeoplePickerUser[] = data.users.map((u) => ({
    id: u.userId,
    fullName: getFullName(u) || "?",
    imageUrl: u.imageUrl,
  }));
  const effectiveDate = date ?? initialDate;
  const effectiveUsers = selectedUsers ?? initialUsers;
  const effectiveFamily =
    familyFriendly !== undefined ? familyFriendly : data.viewerFamilyFriendly;
  const effectiveDog =
    dogFriendly !== undefined ? dogFriendly : data.viewerDogFriendly;
  const effectiveDifficulty =
    difficulty !== undefined ? difficulty : data.viewerDifficulty;

  const onSubmit = async () => {
    const payload: {
      summitId: string;
      summitedAt?: string;
      image?: string;
      usersId?: string[];
      familyFriendly?: number | null;
      dogFriendly?: number | null;
      difficulty?: number | null;
    } = { summitId: summit };

    if (date && toLocalDateString(date) !== toLocalDateString(initialDate)) {
      payload.summitedAt = toLocalDateString(date);
    }
    if (imageBase64) {
      payload.image = imageBase64;
    }
    if (selectedUsers) {
      const initialIds = initialUsers.map((u) => u.id).sort().join(",");
      const currentIds = selectedUsers.map((u) => u.id).sort().join(",");
      if (initialIds !== currentIds) {
        payload.usersId = selectedUsers.map((u) => u.id);
      }
    }
    if (familyFriendly !== undefined) payload.familyFriendly = familyFriendly;
    if (dogFriendly !== undefined) payload.dogFriendly = dogFriendly;
    if (difficulty !== undefined) payload.difficulty = difficulty;

    try {
      await mutateAsync(payload);
      router.back();
    } catch (error) {
      logError(error, "summit/edit/submit");
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Error, try again." }),
      );
    }
  };

  const displayImageUri = pickedUri ?? data.summitImageUrl;

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6 px-6 pt-2">
          <ThemedText className="text-4xl font-bold">
            {data.mountainName}
          </ThemedText>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="Date" />
            </ThemedText>
            <ThemedDateInput
              value={effectiveDate}
              onDateValid={setDate}
              noFutureDates
            />
          </View>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="Summit photo" />
            </ThemedText>
            <TouchableOpacity
              onPress={pickImage}
              className="h-64 w-full items-center justify-center overflow-hidden rounded border-2 border-border bg-background"
            >
              {displayImageUri ? (
                <View className="relative size-full items-center justify-center">
                  <View className="absolute top-0 z-10 size-full">
                    <Image
                      source={{ uri: displayImageUri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        resizeMode: "center",
                      }}
                    />
                  </View>
                  <Image
                    blurRadius={12}
                    source={{ uri: displayImageUri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: 0.5,
                    }}
                  />
                  <View className="absolute bottom-2 right-2 z-20 rounded-full bg-black/50 p-2">
                    {isLoadingImage ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <LucideIcon icon={Camera} size={18} color="white" />
                    )}
                  </View>
                </View>
              ) : (
                <View className="absolute inset-0 items-center justify-center">
                  {isLoadingImage ? (
                    <ActivityIndicator className="opacity-50" />
                  ) : (
                    <LucideIcon icon={Camera} size={32} muted />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View className="gap-3">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="People" />
            </ThemedText>
            <PeopleList
              selected={effectiveUsers}
              onChange={setSelectedUsers}
            />
          </View>
          <SummitRatingFields
            familyFriendly={effectiveFamily ?? null}
            onFamilyFriendlyChange={setFamilyFriendly}
            dogFriendly={effectiveDog ?? null}
            onDogFriendlyChange={setDogFriendly}
            difficulty={effectiveDifficulty ?? null}
            onDifficultyChange={setDifficulty}
          />
          <View className="mt-6 pb-4">
            <ActionRow
              icon={Check}
              size="lg"
              intent="emerald"
              onPress={onSubmit}
              disabled={isPending}
              activeOpacity={0.85}
              iconOverride={isPending ? <ActivityIndicator /> : undefined}
            >
              <FormattedMessage defaultMessage="Save" />
            </ActionRow>
            <ActionRow
              icon={X}
              size="lg"
              onPress={router.back}
              activeOpacity={0.85}
            >
              <FormattedMessage defaultMessage="Cancel" />
            </ActionRow>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
