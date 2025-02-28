import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { analytics } from "expofast-analytics";
import React, { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { IMAGE_TO_BIG } from "@/api/routes/@shared/error-codes";
import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import {
  ThemedText,
  Icon,
  ThemedToggleInput,
  ThemedKeyboardAvoidingView,
  ThemedTextInput,
  Avatar,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { SUMMITS_KEY } from "@/domains/summit/summit.api";
import { USER_SUMMITS_KEY, useUserMe } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { debounce } from "@/lib/debounce";
import { getImageOptimized } from "@/lib/images";

export default function UserMeScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { challengeId } = useChallenge();
  const intl = useIntl();
  const api = useApiWithAuth();
  const { data: me, refetch } = useUserMe();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void refetch();
      void queryClient.refetchQueries({
        queryKey: USER_SUMMITS_KEY(challengeId),
      });
    };
  }, [challengeId, refetch]);

  const pickImage = async () => {
    analytics.action("opened-change-avatar");

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        const pickedImage = result.assets[0];
        setImage(pickedImage.uri);

        const imageOptimized = await getImageOptimized(pickedImage);

        if (imageOptimized.base64) {
          const response = await api.protected.user.me.post({
            image: imageOptimized.base64,
          });
          if (
            response.error &&
            response.error.status === 500 &&
            response.error.value.message === IMAGE_TO_BIG
          ) {
            return Alert.alert(
              intl.formatMessage({
                defaultMessage: "Image too big.",
              }),
            );
          }

          void refetch();
          void queryClient.refetchQueries({
            queryKey: USER_SUMMITS_KEY(challengeId),
          });
          void queryClient.refetchQueries({
            queryKey: SUMMITS_KEY({ limit: 5, challengeId }),
          });
        }
      }
    } catch (error) {
      analytics.error(JSON.stringify(error));

      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again.",
        }),
      );
    }
  };

  const onChangeFirstName = debounce(async (firstName: string) => {
    await api.protected.user.me.post({
      firstName,
    });
  }, 500);

  const onChangeLastName = debounce(async (lastName: string) => {
    await api.protected.user.me.post({
      lastName,
    });
  }, 500);

  const onVisibleHiscoresChange = async (checked: boolean) => {
    analytics.action(`visible-on-highscores`, { value: checked });
    void api.protected.user.me.post({
      visibleOnHiscores: checked,
    });
  };

  const onVisiblePeopleSearchChange = async (checked: boolean) => {
    analytics.action(`visible-on-people-search`, { value: checked });
    void api.protected.user.me.post({
      visibleOnPeopleSearch: checked,
    });
  };

  const onDeleteAccount = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete your account" }),
      intl.formatMessage({
        defaultMessage:
          "Are you sure you want to continue? All the data will be lost.",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Yes, I'm sure" }),
          style: "default",
          onPress: async () => {
            await api.protected.user.delete.get();
            router.dismissAll();
            logout();
          },
        },
      ],
    );
  };

  if (!me) {
    return null;
  }

  return (
    <ThemedKeyboardAvoidingView>
      <ScreenHeader />
      <ScrollView className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="Me" />
        </ThemedText>
        <View className="gap-6">
          <View className="relative items-center justify-center">
            <TouchableOpacity onPress={pickImage}>
              <Avatar
                size="xl"
                className="size-32"
                imageUrl={image ? image : me?.imageUrl}
              />
            </TouchableOpacity>
            {!image && !me?.imageUrl && (
              <View className="pointer-events-none absolute size-full items-center justify-center">
                <Icon
                  name="camera"
                  size={30}
                  color="white"
                  weight="bold"
                  animationSpec={{ effect: { type: "bounce" } }}
                />
              </View>
            )}
          </View>
          <ThemedTextInput
            disabled
            label={intl.formatMessage({ defaultMessage: "Email" })}
            defaultValue={me?.email}
          />
          <ThemedTextInput
            label={intl.formatMessage({ defaultMessage: "First name" })}
            defaultValue={me?.firstName}
            onChangeText={onChangeFirstName}
          />
          <ThemedTextInput
            label={intl.formatMessage({ defaultMessage: "Last name" })}
            defaultValue={me?.lastName}
            onChangeText={onChangeLastName}
          />
          <ThemedToggleInput
            label={intl.formatMessage({
              defaultMessage: "Visible on hiscores?",
            })}
            defaultChecked={me?.visibleOnHiscores}
            onChecked={onVisibleHiscoresChange}
          />
          <ThemedToggleInput
            label={intl.formatMessage({
              defaultMessage: "Visible on people search?",
            })}
            defaultChecked={me?.visibleOnPeopleSearch}
            onChecked={onVisiblePeopleSearchChange}
          />
          <TouchableOpacity onPress={onDeleteAccount}>
            <ThemedText className="text-center text-muted-foreground underline">
              <FormattedMessage defaultMessage="Delete account" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}
