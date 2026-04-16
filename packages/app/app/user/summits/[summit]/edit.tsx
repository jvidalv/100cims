import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";


import {
  ActivityIndicator,
  Button,
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import { PeopleList, ScreenHeader } from "@/components/ui/molecules";
import {
  useSummitGet,
  useUpdateSummitMutation,
} from "@/domains/summit/summit.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getImageOptimized } from "@/lib/images";
import { logError } from "@/lib/log-error";

export default function EditSummitScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { summit } = useLocalSearchParams<{ summit: string }>();
  const { data } = useSummitGet({ summitId: summit });
  const { data: me } = useUserMe();
  const { mutateAsync, isPending } = useUpdateSummitMutation();

  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<
    PeoplePickerUser[] | null
  >(null);

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

  const initialDate = new Date(data.summitedAt);
  const initialUsers: PeoplePickerUser[] = data.users.map((u) => ({
    id: u.userId,
    fullName: getFullName(u) || "?",
    imageUrl: u.imageUrl,
  }));
  const effectiveDate = date ?? initialDate;
  const effectiveUsers = selectedUsers ?? initialUsers;

  const pickImage = async () => {
    setIsLoadingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        const picked = result.assets[0];
        const modifiedImage = await getImageOptimized(picked);
        setImage(modifiedImage);
      }
    } catch (error) {
      logError(error, "summit/edit/image-pick");
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        }),
      );
    } finally {
      setIsLoadingImage(false);
    }
  };

  const onSubmit = async () => {
    const payload: {
      summitId: string;
      summitedAt?: string;
      image?: string;
      usersId?: string[];
    } = { summitId: summit };

    if (date && date.toISOString() !== initialDate.toISOString()) {
      payload.summitedAt = date.toISOString();
    }
    if (image?.base64) {
      payload.image = image.base64;
    }
    if (selectedUsers) {
      const initialIds = initialUsers.map((u) => u.id).sort().join(",");
      const currentIds = selectedUsers.map((u) => u.id).sort().join(",");
      if (initialIds !== currentIds) {
        payload.usersId = selectedUsers.map((u) => u.id);
      }
    }

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

  const displayImageUri = image?.uri ?? data.summitImageUrl;

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
          <Button
            isLoading={isPending}
            intent="success"
            className={twMerge("mt-6")}
            onPress={onSubmit}
          >
            <FormattedMessage defaultMessage="Save" />
          </Button>
          <TouchableOpacity className="mb-4 mt-2" onPress={router.back}>
            <ThemedText className="text-center text-muted-foreground underline">
              <FormattedMessage defaultMessage="Cancel" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
