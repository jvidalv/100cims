import { Link, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { ScrollView, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ActionRow, ChallengeListItem } from "@/components/ui/molecules";
import {
  useActiveChallenge,
  useChallengesGet,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useCommunityChallengesList } from "@/domains/community-challenge/community-challenge.api";
import { useUpdateUserMeMutation, useUserMe } from "@/domains/user/user.api";

type Variant = "official" | "community";

type Props = {
  variant: Variant;
};

/**
 * Shared list body for the Official / Community challenge tabs. The two tab
 * screens (app/challenges/(tabs)/official.tsx, app/challenges/(tabs)/community.tsx)
 * each render this with their own variant.
 */
export const ChallengeList = ({ variant }: Props) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: challenge } = useActiveChallenge();
  const { data: officialChallenges, isPending: isPendingOfficial } =
    useChallengesGet();
  const { data: communityChallenges, isPending: isPendingCommunity } =
    useCommunityChallengesList();
  const { data: user } = useUserMe();
  const {
    mutateAsync: updateUser,
    isPending,
    variables,
  } = useUpdateUserMeMutation();

  const isCommunity = variant === "community";
  const activeChallengeId = challenge?.id;
  const rawChallenges = isCommunity ? communityChallenges : officialChallenges;
  const isPendingList = isCommunity ? isPendingCommunity : isPendingOfficial;

  const challenges = useMemo(() => {
    if (!rawChallenges || !activeChallengeId) return rawChallenges;
    const active = rawChallenges.find((c) => c.id === activeChallengeId);
    if (!active) return rawChallenges;
    return [active, ...rawChallenges.filter((c) => c.id !== activeChallengeId)];
  }, [rawChallenges, activeChallengeId]);

  const onChallengeSelect = async (id: string) => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    await updateUser({ activeChallengeId: id });
    router.back();
  };

  const onCreateChallenge = () => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    router.push("/user/challenges");
  };

  return (
    <ThemedView className="flex-1">
      {isCommunity && (
        <View className="mx-6 mb-4">
          <ActionRow
            icon={Plus}
            size="lg"
            intent="primary"
            onPress={onCreateChallenge}
          >
            <FormattedMessage defaultMessage="New challenge" />
          </ActionRow>
        </View>
      )}
      <ScrollView
        contentContainerClassName="gap-2 px-6 pb-40"
        showsVerticalScrollIndicator={false}
      >
        {isPendingList &&
          !challenges &&
          [0, 1, 2].map((i) => (
            <View
              key={i}
              className="overflow-hidden rounded border-2 border-border"
            >
              <Skeleton className="h-40 w-full rounded-none" />
              <View className="gap-2 p-3">
                <Skeleton className="h-7 w-40" />
                <View className="flex-row gap-3">
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-5 w-14" />
                </View>
              </View>
            </View>
          ))}
        {challenges?.map((challenge, index) => {
          // Use custom emoji for community challenges if available, otherwise
          // fall back to the country flag.
          const displayEmoji =
            "emoji" in challenge && challenge.emoji
              ? challenge.emoji
              : countryToEmoji(challenge.country);

          // Check if the viewer owns this community challenge.
          const isOwner =
            "creatorId" in challenge && challenge.creatorId === user?.id;

          return (
            <ChallengeListItem
              key={challenge.id}
              name={challenge.name}
              emoji={displayEmoji}
              peakImageUrl={challenge.peakImageUrl}
              totalMountains={challenge.totalMountains}
              totalUsers={challenge.totalUsers}
              index={index}
              isSelected={activeChallengeId === challenge.id}
              onPress={() => onChallengeSelect(challenge.id)}
              onEditPress={
                isOwner
                  ? () =>
                      router.push({
                        pathname: "/challenge/[id]/edit",
                        params: { id: challenge.id },
                      })
                  : undefined
              }
              rightElement={
                isPending && variables?.activeChallengeId === challenge.id ? (
                  <ActivityIndicator className="opacity-30" />
                ) : null
              }
            />
          );
        })}

        {!isCommunity && (
          <Link href="/user/suggestions" asChild>
            <ThemedText className="mt-4 text-center font-medium text-muted-foreground underline">
              <FormattedMessage defaultMessage="Suggest a new challenge" />
            </ThemedText>
          </Link>
        )}

        {isCommunity && (!challenges || challenges.length === 0) && (
          <View className="mt-8 items-center">
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="No community challenges yet. Be the first to create one!" />
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};
