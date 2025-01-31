import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { useChallenge } from "@/components/providers/challenge-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import {
  ActivityIndicator,
  Button,
  Icon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import {
  UserForSelectInput,
  UserSelectInput,
} from "@/components/ui/atoms/user-select-input";
import { useMountains, useSummitPost } from "@/domains/mountain/mountain.api";
import { SUMMITS_KEY } from "@/domains/summit/summit.api";
import { USER_SUMMITS_KEY, useUserMe, useUsers } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { isAndroid } from "@/lib/device";
import { getImageOptimized } from "@/lib/images";

export default function SummitMountainScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { challengeId } = useChallenge();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { mutateAsync, isPending } = useSummitPost(slug);
  const { data: mountains } = useMountains();
  const { data: user } = useUserMe();
  const [userQuery, setUserQuery] = useState<string>("");
  const { data: users, isPending: isPendingUsers } = useUsers({
    query: userQuery,
  });

  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [isImageMissing, setIsImageMissing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [date, setDate] = useState<Date>();
  const [selectedUsers, setSelectedUsers] = useState<UserForSelectInput[]>(
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

  const mountain = mountains?.data?.message?.find(
    (mountain) => slug === mountain.slug,
  );

  if (!mountain || !user) {
    return null;
  }

  const pickImage = async () => {
    setIsLoadingImage(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      aspect: [4, 3],
      quality: 0,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      try {
        const modifiedImage = await getImageOptimized(image);
        setImage(modifiedImage);
      } catch {
        Alert.alert(
          intl.formatMessage({
            defaultMessage: "Error, try again or use another image.",
          }),
        );
      }
    }
    setIsLoadingImage(false);
  };

  const submitDisabled =
    !date || !image?.base64 || !selectedUsers?.length || !mountain;

  const onSubmit = async () => {
    if (!image?.base64) {
      setIsImageMissing(true);
      return;
    }

    if (submitDisabled) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Missing information.",
        }),
      );
    }

    try {
      const response = await mutateAsync({
        date: date.toString(),
        image: image.base64,
        mountainId: mountain?.id,
        usersId: selectedUsers.map((user) => user.id),
      });

      if (response.error) {
        switch (response.error.status) {
          case 500:
            return response.error.value.message === IMAGE_TO_BIG
              ? Alert.alert(
                  intl.formatMessage({
                    defaultMessage: "Image too big.",
                  }),
                )
              : Alert.alert(
                  intl.formatMessage({
                    defaultMessage: "Error, try again.",
                  }),
                );
        }
      } else {
        void queryClient.refetchQueries({
          queryKey: SUMMITS_KEY({ limit: 5, challengeId }),
        });
        void queryClient.refetchQueries({
          queryKey: SUMMITS_KEY({
            mountainId: mountain.id,
            limit: 100,
            challengeId,
          }),
        });
        void queryClient.refetchQueries({
          queryKey: USER_SUMMITS_KEY(challengeId),
        });
        router.dismiss();
      }
    } catch {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again.",
        }),
      );
    }
  };

  return (
    <ThemedView className={twMerge("flex-1", isAndroid && "pt-12")}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="gap-6 px-6 pt-6">
          <View className="items-center justify-center">
            <View
              className="mb-4 overflow-hidden rounded-full"
              style={{ width: 100, height: 100 }}
            >
              <Image
                source={mountain.imageUrl}
                style={{ width: 100, height: 100 }}
              />
            </View>
            <ThemedText className="mb-1 text-lg font-bold text-muted-foreground">
              <FormattedMessage defaultMessage="Summit" />
            </ThemedText>
            <ThemedText className="text-center text-3xl font-black">
              {mountain.name}
            </ThemedText>
          </View>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              {" "}
              <FormattedMessage defaultMessage="Date" />
            </ThemedText>
            <ThemedDateInput value={new Date()} onDateValid={setDate} />
          </View>
          <View className="gap-2">
            <ThemedText
              lo-0
              className={twMerge(
                "text-lg font-bold",
                isImageMissing && "text-red-500",
              )}
            >
              <FormattedMessage defaultMessage="Summit photo" />
            </ThemedText>
            <TouchableOpacity
              onPress={pickImage}
              className={twMerge(
                "h-48 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-background",
                isImageMissing && "border-red-500",
              )}
            >
              {image ? (
                <View className="relative size-full items-center justify-center">
                  <View className="absolute top-0 z-10 size-full">
                    <Image
                      source={{ uri: image.uri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
                      contentPosition="center"
                    />
                  </View>
                  <Image
                    blurRadius={99}
                    source={{ uri: image.uri }}
                    style={{ width: "100%", height: "100%", opacity: 0.5 }}
                    contentFit="cover"
                    contentPosition="center"
                  />
                </View>
              ) : isLoadingImage ? (
                <ActivityIndicator className="opacity-50" />
              ) : (
                <Icon
                  name="camera"
                  size={32}
                  muted
                  animationSpec={{
                    effect: { type: "bounce" },
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
          <View className="gap-2">
            <ThemedText className="text-lg font-bold">
              <FormattedMessage defaultMessage="People" />
            </ThemedText>
            <UserSelectInput
              maxSelected={5}
              firstSelectedRemovable={false}
              selectedUsers={selectedUsers}
              onQueryChange={setUserQuery}
              query={userQuery}
              isFetchingUsers={isPendingUsers}
              selectableUsers={users?.map((selectableUser) => ({
                id: selectableUser.id,
                fullName: getFullName(selectableUser) || "?",
                imageUrl: selectableUser.imageUrl,
              }))}
              onSelectedUsersChange={setSelectedUsers}
            />
          </View>
          <Button isLoading={isPending} intent="accent" onPress={onSubmit}>
            <FormattedMessage defaultMessage="Save" />
          </Button>
          <TouchableOpacity className="mt-2" onPress={router.back}>
            <ThemedText className="text-center text-muted-foreground underline">
              <FormattedMessage defaultMessage="I'll summit later" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
