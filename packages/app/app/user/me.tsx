import { analytics } from "@jvidalv/react-analytics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

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
import { useHiscoresGet } from "@/domains/hiscores/hiscores.api";
import { SUMMITS_KEY } from "@/domains/summit/summit.api";
import {
  USER_SUMMITS_KEY,
  useDeleteAccountMutation,
  useUpdateUserMeMutation,
  useUserMe,
} from "@/domains/user/user.api";
import { debounce } from "@/lib/debounce";
import { IMAGE_TO_BIG } from "@/lib/error-codes";
import { getImageOptimized } from "@/lib/images";

export default function UserMeScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { challengeId } = useChallenge();
  const intl = useIntl();
  const { refetch: refetchHiscores } = useHiscoresGet();
  const { mutateAsync: updateUserMe } = useUpdateUserMeMutation();
  const { mutateAsync: deleteAccount } = useDeleteAccountMutation();
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
          try {
            await updateUserMe({
              imageUrl: imageOptimized.base64,
            });

            void refetch();
            void queryClient.refetchQueries({
              queryKey: USER_SUMMITS_KEY(challengeId),
            });
            void queryClient.refetchQueries({
              queryKey: SUMMITS_KEY({
                limit: 5,
                challengeId,
                mountainId: undefined,
              }),
            });
          } catch (error: any) {
            if (error?.message === IMAGE_TO_BIG) {
              return Alert.alert(
                intl.formatMessage({
                  defaultMessage: "Image too big.",
                }),
              );
            }
            throw error;
          }
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
    await updateUserMe({
      firstName,
    });
  }, 500);

  const onChangeLastName = debounce(async (lastName: string) => {
    await updateUserMe({
      lastName,
    });
  }, 500);

  const onChangeTown = debounce(async (town: string) => {
    await updateUserMe({
      town,
    });
  }, 500);

  const onVisibleHiscoresChange = async (checked: boolean) => {
    analytics.action(`visible-on-highscores`, { value: checked });
    await updateUserMe({
      visibleOnHiscores: checked,
    });
    void refetchHiscores();
  };

  const onVisiblePeopleSearchChange = async (checked: boolean) => {
    analytics.action(`visible-on-people-search`, { value: checked });
    void updateUserMe({
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
            analytics.action("delete-account");
            await deleteAccount();
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
          <ThemedTextInput
            label={intl.formatMessage({ defaultMessage: "Town" })}
            defaultValue={me?.town}
            onChangeText={onChangeTown}
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
          <TouchableOpacity
            onPress={onDeleteAccount}
            className="flex-row items-center gap-1 opacity-50"
          >
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Delete account" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}
