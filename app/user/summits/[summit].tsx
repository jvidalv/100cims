import { format } from "date-fns/format";
import { Image } from "expo-image";
import { Redirect, useLocalSearchParams } from "expo-router";
import { FormattedMessage } from "react-intl";
import { ScrollView, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Avatar,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useSummitGet } from "@/domains/summit/summit.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

const Content = () => {
  const { summit } = useLocalSearchParams<{ summit: string }>();

  const { data, isPending } = useSummitGet({ summitId: summit });

  if (isPending || !data) {
    return (
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className="px-6">
          <Skeleton className="h-9 w-40" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView className="flex-1 px-6">
        <ThemedText className=" text-4xl font-bold">
          {data.mountainName}
        </ThemedText>
        <ThemedText className="mb-8 text-lg font-semibold text-muted-foreground">
          {format(data.summitedAt, "dd MMM yyyy")}
        </ThemedText>
        <ThemedText className="mb-2 text-xl font-medium">
          <FormattedMessage defaultMessage="People" />
        </ThemedText>
        <View className="mb-6 gap-2">
          {data.users.map((user) => (
            <View className="flex-row items-center gap-3" key={user.userId}>
              <Avatar
                size="sm"
                imageUrl={user.imageUrl}
                initials={getInitials(getFullName(user))}
              />
              <ThemedText className="text-lg">{getFullName(user)}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText className="mb-2 text-xl font-medium">
          <FormattedMessage defaultMessage="Photo" />
        </ThemedText>
        <View className="overflow-hidden rounded-xl">
          <Image
            source={data.summitImageUrl}
            placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
            style={{ height: 500, width: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={500}
          />
        </View>
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
