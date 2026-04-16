import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";

import { queryClient } from "@/components/providers/query-client-provider";
import {
  ActivityIndicator,
  Button,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import { PeopleList, ScreenHeader } from "@/components/ui/molecules";
import { useMountains, useSummitPost } from "@/domains/mountain/mountain.api";
import { SUMMITS_KEY } from "@/domains/summit/summit.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-cache";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getImageOptimized } from "@/lib/images";
import { logError } from "@/lib/log-error";
import { userKeys } from "@/lib/query-keys";

export default function SummitMountainScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { mutateAsync, isPending } = useSummitPost(slug);
  const { data: mountains } = useMountains();
  const { data: user } = useUserMe();

  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
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

  if (!mountain || !user) {
    return null;
  }

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
        const image = result.assets[0];

        const modifiedImage = await getImageOptimized(image);
        setImage(modifiedImage);
      }
    } catch (error) {
      logError(error, "mountain/summit/image-pick");
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        }),
      );
    } finally {
      setIsLoadingImage(false);
    }
  };

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
        date: date.toISOString(),
        image: image?.base64 ?? undefined,
        mountainId: mountain?.id,
        usersId: selectedUsers.map((user) => user.id),
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
      <ScreenHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-6 px-6 pt-2">
          <ThemedText className="text-4xl font-bold">
            {mountain.name}
          </ThemedText>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="Date" />
            </ThemedText>
            <ThemedDateInput value={date} onDateValid={setDate} noFutureDates />
          </View>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="Summit photo" />
            </ThemedText>
            <TouchableOpacity
              onPress={pickImage}
              className="h-64 w-full items-center justify-center overflow-hidden rounded border-2 border-border bg-background"
            >
              {image ? (
                <View className="relative size-full items-center justify-center">
                  <View className="absolute top-0 z-10 size-full">
                    <Image
                      source={{ uri: image.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        resizeMode: "center",
                      }}
                    />
                  </View>
                  <Image
                    blurRadius={12}
                    source={{ uri: image.uri }}
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
                      <LucideIcon icon={Camera} size={32} muted />
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View className="gap-3">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="People" />
            </ThemedText>
            <PeopleList
              selected={selectedUsers}
              onChange={setSelectedUsers}
            />
          </View>
          <Button
            isLoading={isPending}
            intent="success"
            className="mt-6"
            onPress={onSubmit}
          >
            <FormattedMessage defaultMessage="Summit" />
          </Button>
          <TouchableOpacity className="mb-4 mt-2" onPress={router.back}>
            <ThemedText className="text-center text-muted-foreground underline">
              <FormattedMessage defaultMessage="I'll summit later" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
