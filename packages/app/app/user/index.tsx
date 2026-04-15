import * as Application from "expo-application";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import {
  ArrowRight,
  Backpack,
  ChevronRight,
  Flag,
  Heart,
  Info,
  List,
  MessageCircle,
  User,
  UsersRound,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";

import {
  ThemedText,
  ThemedView,
  LucideIcon,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { useUserMe } from "@/domains/user/user.api";

export default function UserIndexScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { data } = useUserMe();
  const { data: plansUnread } = usePlanChatUnread();
  const hasUnreadMessages = !!plansUnread?.length;

  const items: {
    icon: LucideIconType;
    text: string;
    onPress: () => void;
    showDot?: boolean;
  }[] = [
    {
      icon: User,
      text: intl.formatMessage({ defaultMessage: "My information" }),
      onPress: () => router.push("/user/me"),
    },
    {
      icon: UsersRound,
      text: intl.formatMessage({ defaultMessage: "My people" }),
      onPress: () => router.push("/user/people"),
    },
    {
      icon: List,
      text: intl.formatMessage({ defaultMessage: "My summits" }),
      onPress: () => router.push("/user/summits"),
    },
    {
      icon: Backpack,
      text: intl.formatMessage({ defaultMessage: "My plans" }),
      onPress: () => router.push("/user/plans"),
      showDot: hasUnreadMessages,
    },
    {
      icon: Flag,
      text: intl.formatMessage({ defaultMessage: "My challenges" }),
      onPress: () => router.push("/user/challenges"),
    },
    {
      icon: Info,
      text: intl.formatMessage({ defaultMessage: "About the app" }),
      onPress: () => router.push("/user/about-the-app"),
    },
    {
      icon: MessageCircle,
      text: intl.formatMessage({ defaultMessage: "Help & Suggestions" }),
      onPress: () => router.push("/user/suggestions"),
    },
  ];

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ThemedView className="flex-1 px-6">
        <View className="mb-4 flex-row items-center justify-between">
          <ThemedText className="text-4xl font-bold">
            {data?.firstName}
          </ThemedText>
          <Link
            href={{ pathname: "/user/[user]", params: { user: data?.id! } }}
            className="-mx-2 -mb-2 p-2"
          >
            <View className="flex-row items-center gap-1">
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="Your profile" />
              </ThemedText>
              <LucideIcon icon={ArrowRight} size={12} muted />
            </View>
          </Link>
        </View>
        <View className="mb-4 rounded border-2 border-border">
          {items.map(({ icon, showDot, text, onPress }, index) => (
            <Fragment key={text}>
              <TouchableOpacity
                onPress={onPress}
                className="justify-center p-4"
              >
                <View className="flex-row items-center gap-4">
                  <LucideIcon icon={icon} />
                  <ThemedText className="text-xl font-semibold">
                    {text}
                  </ThemedText>
                  {showDot && (
                    <View className="-ml-2 size-3 rounded-full bg-primary" />
                  )}
                  <View className="ml-auto opacity-25">
                    <LucideIcon icon={ChevronRight} size={16} />
                  </View>
                </View>
              </TouchableOpacity>
              {index + 1 !== items.length && (
                <View className="h-[2px] w-full bg-border" />
              )}
            </Fragment>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => router.push("/support")}
          className="mb-4"
        >
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 6, padding: 2 }}
          >
            <View
              className="justify-center bg-background p-4"
              style={{ borderRadius: 4 }}
            >
              <View className="flex-row items-center gap-4">
                <LucideIcon icon={Heart} color={Colors.light.primary} />
                <ThemedText className="text-xl font-semibold text-primary">
                  <FormattedMessage defaultMessage="Support Cims" />
                </ThemedText>
                <View className="ml-auto opacity-25">
                  <LucideIcon icon={ChevronRight} size={16} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <View className="mt-auto pb-12">
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="Version" />
            {" ~"}
            {Application.nativeApplicationVersion}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}
