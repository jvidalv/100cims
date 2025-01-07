import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ThemedText,
  ThemedView,
  Icon,
  IconSymbolName,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useUserMe } from "@/domains/user/user.api";

export default function UserIndexScreen() {
  const intl = useIntl();
  const { logout } = useAuth();
  const router = useRouter();
  const { data } = useUserMe();
  const items: {
    iconName: IconSymbolName;
    text: string;
    onPress: () => void;
  }[] = [
    {
      iconName: "person.fill",
      text: intl.formatMessage({ defaultMessage: "Me" }),
      onPress: () => router.push("/user/me"),
    },
    {
      iconName: "mountain.2.fill",
      text: intl.formatMessage({ defaultMessage: "My summits" }),
      onPress: () => router.push("/user/summits"),
    },
    {
      iconName: "medal.fill",
      text: intl.formatMessage({ defaultMessage: "100 cims challenge" }),
      onPress: () => router.push("/user/100-cims-challenge"),
    },
    {
      iconName: "info.circle.fill",
      text: intl.formatMessage({ defaultMessage: "About the app" }),
      onPress: () => router.push("/user/about-the-app"),
    },
  ];

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

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ThemedView className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          {data?.firstName}
        </ThemedText>
        <View className="mb-4 rounded-xl border-2 border-border">
          {items.map(({ iconName, text, onPress }, index) => (
            <Fragment key={text}>
              <TouchableOpacity
                onPress={onPress}
                className="justify-center p-4"
              >
                <View className="flex-row items-center gap-4">
                  <Icon name={iconName} />
                  <ThemedText className="text-xl font-semibold">
                    {text}
                  </ThemedText>
                  <View className="ml-auto opacity-25">
                    <Icon name="chevron.right" weight="semibold" size={16} />
                  </View>
                </View>
              </TouchableOpacity>
              {index + 1 !== items.length && (
                <View className="h-[2px] w-full bg-border" />
              )}
            </Fragment>
          ))}
        </View>
        <View>
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="Version" />{" "}
            {Application.nativeApplicationVersion}
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={onLogout}
          className="mt-auto items-center pb-12"
        >
          <ThemedText className="text-muted-foreground underline">
            <FormattedMessage defaultMessage="Logout" />
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}
