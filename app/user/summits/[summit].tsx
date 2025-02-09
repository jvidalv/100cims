import { format } from "date-fns/format";
import { Image } from "expo-image";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Avatar,
  Button,
  Icon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useSummitGet } from "@/domains/summit/summit.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

const Content = () => {
  const router = useRouter();
  const { summit } = useLocalSearchParams<{ summit: string }>();

  const { data, isPending } = useSummitGet({ summitId: summit });

  if (isPending || !data) {
    return (
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className="px-6">
          <Skeleton className="mb-1 h-10 w-64" />
          <Skeleton className="mb-8 h-6 w-20" />
          <ThemedText className="mb-2 text-xl font-medium">
            <FormattedMessage defaultMessage="People" />
          </ThemedText>
          <Skeleton className="mb-6 size-10 rounded-full" />
          <ThemedText className="mb-2 text-xl font-medium">
            <FormattedMessage defaultMessage="Photo" />
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 pb-16">
      <ScreenHeader />
      <ScrollView className="flex-1 px-6">
        <Link
          href={{
            pathname: "/mountain/[slug]",
            params: { slug: data.mountainSlug },
          }}
          asChild
        >
          <TouchableOpacity className="mb-8">
            <ThemedText className="text-3xl font-bold">
              {data.mountainName}
            </ThemedText>
            <View className="flex-row items-center gap-1">
              <ThemedText className="text-lg font-semibold text-muted-foreground">
                {format(data.summitedAt, "dd MMM yyyy")}
              </ThemedText>
              <Icon name="arrow.forward" size={20} muted />
            </View>
          </TouchableOpacity>
        </Link>
        <ThemedText className="mb-2 text-xl font-medium">
          <FormattedMessage defaultMessage="People" />
        </ThemedText>
        <View className="mb-6 gap-2">
          {data.users.map((user) => (
            <Link
              href={{ pathname: "/user/[user]", params: { user: user.userId } }}
              key={user.userId}
              asChild
            >
              <TouchableOpacity className="flex-row items-center gap-3">
                <Avatar
                  size="sm"
                  imageUrl={user.imageUrl}
                  initials={getInitials(getFullName(user))}
                />
                <ThemedText className="text-lg">{getFullName(user)}</ThemedText>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
        <ThemedText className="mb-2 text-xl font-medium">
          <FormattedMessage defaultMessage="Photo" />
        </ThemedText>
        <View className="mb-6 overflow-hidden rounded-xl">
          <Image
            source={data.summitImageUrl}
            placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
            style={{ height: 500, width: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={500}
          />
        </View>
        <Button intent="outline" onPress={router.back}>
          <FormattedMessage defaultMessage="Back" />
        </Button>
      </ScrollView>
    </ThemedView>
  );
};
export default function SummitsSummitPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return <Content />;
}
