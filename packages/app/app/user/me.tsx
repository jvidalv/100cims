import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Appearance,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import {
  ThemedText,
  LucideIcon,
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
import { logError } from "@/lib/log-error";
import { userKeys } from "@/lib/query-keys";

type Tab = "details" | "privacy" | "theme" | "account";

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
  const [tab, setTab] = useState<Tab>("details");

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
      logError(error, "user/me/avatar");
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again.",
        }),
      );
    }
  };

  const onChangeFirstName = useMemo(
    () =>
      debounce(async (firstName: string) => {
        await updateUserMe({ firstName });
      }, 500),
    [updateUserMe],
  );

  const onChangeLastName = useMemo(
    () =>
      debounce(async (lastName: string) => {
        await updateUserMe({ lastName });
      }, 500),
    [updateUserMe],
  );

  const onChangeTown = useMemo(
    () =>
      debounce(async (town: string) => {
        await updateUserMe({ town });
      }, 500),
    [updateUserMe],
  );

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

  const onLogout = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Login out" }),
      intl.formatMessage({
        defaultMessage: "Are you sure you want to continue?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Yes" }),
          style: "default",
          onPress: () => {
            logout();
            router.dismissAll();
          },
        },
      ],
    );
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: intl.formatMessage({ defaultMessage: "Details" }) },
    { id: "privacy", label: intl.formatMessage({ defaultMessage: "Privacy" }) },
    { id: "theme", label: intl.formatMessage({ defaultMessage: "Theme" }) },
    { id: "account", label: intl.formatMessage({ defaultMessage: "Account" }) },
  ];

  return (
    <ThemedKeyboardAvoidingView>
      <ScreenHeader />
      <View className="px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="Me" />
        </ThemedText>
        <View className="relative mb-6 items-center justify-center">
          <TouchableOpacity onPress={pickImage} className="relative">
            <Avatar
              size="xl"
              className="size-32"
              imageUrl={image ? image : me.imageUrl}
            />
            {(image || me.imageUrl) && (
              <View className="absolute bottom-0 right-0 size-7 items-center justify-center rounded-full border-2 border-background bg-primary">
                <LucideIcon icon={Camera} size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
          {!image && !me.imageUrl && (
            <View className="pointer-events-none absolute size-full items-center justify-center">
              <LucideIcon icon={Camera} size={30} color="white" />
            </View>
          )}
        </View>
        <View className="mb-4 flex-row justify-center gap-1">
          {tabs.map(({ id, label }) => {
            const isSelected = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                className={twMerge(
                  "rounded py-2 px-2.5 mr-1",
                  isSelected ? "bg-primary" : "bg-border",
                )}
              >
                <ThemedText
                  className={twMerge(
                    "font-medium text-foreground",
                    isSelected && "text-white",
                  )}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView className="flex-1 px-6 pt-4">
        {tab === "details" && (
          <View className="gap-6 pb-8">
            <ThemedTextInput
              disabled
              label={intl.formatMessage({ defaultMessage: "Email" })}
              defaultValue={me.email}
            />
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "First name" })}
              defaultValue={me.firstName}
              onChangeText={onChangeFirstName}
            />
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Last name" })}
              defaultValue={me.lastName}
              onChangeText={onChangeLastName}
            />
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Town" })}
              defaultValue={me.town}
              onChangeText={onChangeTown}
            />
          </View>
        )}

        {tab === "privacy" && (
          <View className="gap-6 pb-8">
            <ThemedToggleInput
              label={intl.formatMessage({
                defaultMessage: "Visible on hiscores?",
              })}
              defaultChecked={me.visibleOnHiscores}
              onChecked={onVisibleHiscoresChange}
            />
            <ThemedToggleInput
              label={intl.formatMessage({
                defaultMessage: "Visible on people search?",
              })}
              defaultChecked={me.visibleOnPeopleSearch}
              onChecked={onVisiblePeopleSearchChange}
            />
          </View>
        )}

        {tab === "theme" && (
          <View className="gap-6 pb-8">
            <ThemedToggleInput
              label={intl.formatMessage({ defaultMessage: "Dark theme?" })}
              defaultChecked={colorScheme === "dark"}
              onChecked={(checked) =>
                Appearance.setColorScheme(checked ? "dark" : "light")
              }
            />
          </View>
        )}

        {tab === "account" && (
          <View className="gap-6 pb-8">
            <View className="rounded-lg border-2 border-border p-4">
              <ThemedText className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <FormattedMessage defaultMessage="Session" />
              </ThemedText>
              <ThemedText className="mb-3 text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Sign out of this device. Your data stays in your account." />
              </ThemedText>
              <TouchableOpacity
                onPress={onLogout}
                className="self-start rounded border border-border px-3 py-2"
              >
                <ThemedText className="font-semibold">
                  <FormattedMessage defaultMessage="Logout" />
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View className="rounded-lg border-2 border-red-500/60 bg-red-500/5 p-4">
              <ThemedText className="mb-1 text-sm font-semibold uppercase tracking-wide text-red-500">
                <FormattedMessage defaultMessage="Danger zone" />
              </ThemedText>
              <ThemedText className="mb-3 text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Deleting your account is permanent. All your summits and plans will be lost." />
              </ThemedText>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/user/suggestions")}
                  className="rounded border border-border px-3 py-2"
                >
                  <ThemedText className="font-semibold">
                    <FormattedMessage defaultMessage="Help & Support" />
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDeleteAccount}
                  className="rounded border border-red-500/60 px-3 py-2"
                >
                  <ThemedText className="font-semibold text-red-500">
                    <FormattedMessage defaultMessage="Delete account" />
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}
