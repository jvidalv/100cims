import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Appearance,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
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
  useDeleteAccountMutation,
  useUpdateUserMeMutation,
  useUserMe,
} from "@/domains/user/user.api";
import { debounce } from "@/lib/debounce";
import { IMAGE_TO_BIG } from "@/lib/error-codes";
import { getImageOptimized } from "@/lib/images";
import { userKeys } from "@/lib/query-keys";

export default function UserMeScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const intl = useIntl();
  const { refetch: refetchHiscores } = useHiscoresGet();
  const { mutateAsync: updateUserMe } = useUpdateUserMeMutation();
  const { mutateAsync: deleteAccount } = useDeleteAccountMutation();
  const { data: me, refetch } = useUserMe();
  const colorScheme = useColorScheme();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void refetch();
      void queryClient.refetchQueries({
        queryKey: userKeys.summits(),
      });
    };
  }, [refetch]);

  const pickImage = async () => {
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
              queryKey: userKeys.summits(),
            });
            void queryClient.refetchQueries({
              queryKey: SUMMITS_KEY({
                limit: 5,
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
    await updateUserMe({
      visibleOnHiscores: checked,
    });
    void refetchHiscores();
  };

  const onVisiblePeopleSearchChange = async (checked: boolean) => {
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
            <TouchableOpacity onPress={pickImage} className="relative">
              <Avatar
                size="xl"
                className="size-32"
                imageUrl={image ? image : me?.imageUrl}
              />
              {(image || me?.imageUrl) && (
                <View className="absolute bottom-0 right-0 size-7 items-center justify-center rounded-full border-2 border-background bg-primary">
                  <Icon
                    name="camera.fill"
                    size={12}
                    color="white"
                    weight="bold"
                  />
                </View>
              )}
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
          <ThemedToggleInput
            label={intl.formatMessage({ defaultMessage: "Dark theme?" })}
            defaultChecked={colorScheme === "dark"}
            onChecked={(checked) =>
              Appearance.setColorScheme(checked ? "dark" : "light")
            }
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
