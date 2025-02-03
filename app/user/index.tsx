import * as Application from "expo-application";
import { Link, useRouter } from "expo-router";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ThemedText,
  ThemedView,
  Icon,
  IconSymbolName,
  ProgressBar,
  Button,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useDonorsCurrentMonthGet } from "@/domains/donors/donors.api";
import { useUserMe } from "@/domains/user/user.api";

const Donation = () => {
  const router = useRouter();
  const { data } = useDonorsCurrentMonthGet();
  const totalDonation = data?.totalDonation
    ? parseFloat(data?.totalDonation)
    : 0;
  const progress = (totalDonation * 100) / 30;
  const isProgressOver100 = progress >= 100;

  return (
    <Link
      href={{ pathname: "/user/donors", params: { donate: "true" } }}
      asChild
    >
      <TouchableOpacity className="rounded-2xl border-4 border-primary p-4">
        <ThemedText className="text-xl font-bold">
          <FormattedMessage defaultMessage="Keep 100cims alive" />
        </ThemedText>
        <ThemedText className="mb-4 text-lg text-muted-foreground">
          <FormattedMessage defaultMessage="The monthly maintenance cost is ~30€" />
        </ThemedText>
        <ProgressBar
          intent={isProgressOver100 ? "success" : "primary"}
          progress={progress}
          className="mb-1"
        />
        <ThemedText className="mb-4 text-sm text-muted-foreground/80">
          <FormattedMessage
            defaultMessage="*Current month donations, {donations}€"
            values={{ donations: totalDonation }}
          />
        </ThemedText>
        <Button
          onPress={() =>
            router.push({
              pathname: "/user/donors",
              params: { donate: "true" },
            })
          }
        >
          <FormattedMessage defaultMessage="Help 100cims" />
        </Button>
      </TouchableOpacity>
    </Link>
  );
};

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
      iconName: "info.circle.fill",
      text: intl.formatMessage({ defaultMessage: "About the app" }),
      onPress: () => router.push("/user/about-the-app"),
    },
    {
      iconName: "text.bubble.fill",
      text: intl.formatMessage({ defaultMessage: "Suggestions" }),
      onPress: () => router.push("/user/suggestions"),
    },
    {
      iconName: "eurosign.circle.fill",
      text: intl.formatMessage({ defaultMessage: "Donors" }),
      onPress: () => router.push("/user/donors"),
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
            <FormattedMessage defaultMessage="Version" />
            {" ~"}
            {Application.nativeApplicationVersion}
          </ThemedText>
        </View>
        <View className="flex-1 justify-center">
          <Donation />
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
