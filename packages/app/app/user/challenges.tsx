import { Link, Redirect, useRouter } from "expo-router";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Icon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { ChallengeListItem, ScreenHeader } from "@/components/ui/molecules";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { useCommunityChallengesList } from "@/domains/community-challenge/community-challenge.api";
import { isAndroid } from "@/lib/device";

export default function UserChallengesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: challenges, isPending } = useCommunityChallengesList({
    filter: "mine",
  });
  const { data: activeChallenge } = useActiveChallenge();

  const { publicChallenges, privateChallenges } = useMemo(() => {
    const publicList = challenges?.filter((c) => c.isPublic) ?? [];
    const privateList = challenges?.filter((c) => !c.isPublic) ?? [];
    return { publicChallenges: publicList, privateChallenges: privateList };
  }, [challenges]);

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-6 flex-row items-end justify-between px-6">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="My challenges" />
        </ThemedText>
        <Link href="/community-challenge/create" asChild>
          <TouchableOpacity className="flex-row items-center gap-1">
            <ThemedText>
              <FormattedMessage defaultMessage="New" />
            </ThemedText>
            <Icon
              name="plus"
              size={isAndroid ? 22 : 14}
              animationSpec={{ effect: { type: "bounce" } }}
            />
          </TouchableOpacity>
        </Link>
      </View>
      <ScrollView contentContainerClassName="gap-3 px-6 pb-28">
        {isPending && (
          <>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </>
        )}
        {!isPending && !challenges?.length && (
          <View className="relative mt-auto rounded-xl border-2 border-border p-4">
            <View className="absolute right-2 top-2">
              <Icon
                name="star.fill"
                color="gold"
                size={24}
                animationSpec={{ effect: { type: "bounce" } }}
              />
            </View>
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="Do you know?" />
            </ThemedText>
            <ThemedText>
              <FormattedMessage defaultMessage="You can now create your own challenges and also your mountains, other people can join these challenges!" />
            </ThemedText>
          </View>
        )}

        {/* Public challenges */}
        {publicChallenges.length > 0 && (
          <>
            <ThemedText className="mt-2 text-lg font-semibold">
              <FormattedMessage defaultMessage="Public" />
            </ThemedText>
            {publicChallenges.map((item, index) => (
              <ChallengeListItem
                key={item.id}
                name={item.name}
                emoji={item.emoji || countryToEmoji(item.country)}
                totalMountains={item.totalMountains}
                index={index}
                isSelected={activeChallenge?.id === item.id}
                onPress={() =>
                  router.push({
                    pathname: "/community-challenge/[id]/edit",
                    params: { id: item.id },
                  })
                }
                rightElement={
                  Number(item.totalUsers) > 0 ? (
                    <View className="flex-row items-center gap-1">
                      <ThemedText className="font-medium text-muted-foreground">
                        {item.totalUsers}
                      </ThemedText>
                      <Icon name="person.2.fill" muted size={18} />
                    </View>
                  ) : null
                }
              />
            ))}
          </>
        )}

        {/* Private challenges */}
        {privateChallenges.length > 0 && (
          <>
            <ThemedText className="mt-4 text-lg font-semibold">
              <FormattedMessage defaultMessage="Private" />
            </ThemedText>
            {privateChallenges.map((item, index) => (
              <ChallengeListItem
                key={item.id}
                name={item.name}
                emoji={item.emoji || countryToEmoji(item.country)}
                totalMountains={item.totalMountains}
                index={publicChallenges.length + index}
                isSelected={activeChallenge?.id === item.id}
                onPress={() =>
                  router.push({
                    pathname: "/community-challenge/[id]/edit",
                    params: { id: item.id },
                  })
                }
                rightElement={
                  Number(item.totalUsers) > 0 ? (
                    <View className="flex-row items-center gap-1">
                      <ThemedText className="font-medium text-muted-foreground">
                        {item.totalUsers}
                      </ThemedText>
                      <Icon name="person.2.fill" muted size={18} />
                    </View>
                  ) : null
                }
              />
            ))}
          </>
        )}

        {!isPending && (
          <ThemedText className="mt-4 text-center text-sm text-muted-foreground">
            <FormattedMessage
              defaultMessage="{count} of {max} challenges"
              values={{ count: challenges?.length ?? 0, max: 5 }}
            />
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}
