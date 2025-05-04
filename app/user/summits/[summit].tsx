import { format } from "date-fns/format";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, Image, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Avatar,
  Button,
  DynamicImage,
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
          <View className="flex-row justify-between">
            <View>
              <Skeleton className="mb-1 h-9 w-64" />
              <Skeleton className="mb-8 h-6 w-20" />
            </View>
            <Skeleton className="size-16 rounded-lg" />
          </View>
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="People" />
          </ThemedText>
          <Skeleton className="mb-6 size-10 rounded-full" />
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Photo" />
          </ThemedText>
        </View>
        <Skeleton className="size-full min-h-[500px]" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12"
      >
        <Link
          href={{
            pathname: "/mountain/[slug]",
            params: { slug: data.mountainSlug },
          }}
          asChild
        >
          <TouchableOpacity className="mb-4 flex-row justify-between bg-background px-6 pb-2">
            <View className="flex-1">
              <ThemedText className="text-3xl font-bold">
                {data.mountainName}
              </ThemedText>
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-lg font-semibold text-muted-foreground">
                  {format(data.summitedAt, "dd MMM yyyy")}
                </ThemedText>
              </View>
            </View>
            {data.mountainImageUrl ? (
              <Image
                className="size-16 rounded-lg"
                source={{ uri: data.mountainImageUrl }}
              />
            ) : (
              <View className="rounded-lg bg-neutral-500" />
            )}
          </TouchableOpacity>
        </Link>
        <View className="px-6">
          <ThemedText className="mb-3 text-2xl font-semibold">
            <FormattedMessage defaultMessage="People" />
          </ThemedText>
          <View className="mb-6 gap-3">
            {data.users.map((user) => (
              <Link
                href={{
                  pathname: "/user/[user]",
                  params: { user: user.userId },
                }}
                key={user.userId}
                asChild
              >
                <TouchableOpacity className="flex-row items-center gap-3">
                  <Avatar
                    size="sm"
                    imageUrl={user.imageUrl}
                    initials={getInitials(getFullName(user))}
                  />
                  <ThemedText className="text-lg">
                    {getFullName(user)}
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
        <ThemedText className="mb-3 px-6 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Photo" />
        </ThemedText>
        <View className="mb-6 overflow-hidden rounded-lg">
          <DynamicImage uri={data.summitImageUrl} />
        </View>
        <Button intent="ghost" onPress={router.back}>
          <FormattedMessage defaultMessage="Go back" />
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
