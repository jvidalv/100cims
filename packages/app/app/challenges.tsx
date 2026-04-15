import { Link, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";


import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ChallengeListItem, ScreenHeader } from "@/components/ui/molecules";
import {
  useActiveChallenge,
  useChallengesGet,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useCommunityChallengesList } from "@/domains/community-challenge/community-challenge.api";
import { useUpdateUserMeMutation, useUserMe } from "@/domains/user/user.api";

type Tab = "official" | "community";

export default function ChallengesScreen() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: challenge } = useActiveChallenge();
  const { data: officialChallenges } = useChallengesGet();
  const { data: communityChallenges } = useCommunityChallengesList();
  const { data: user } = useUserMe();
  const {
    mutateAsync: updateUser,
    isPending,
    variables,
  } = useUpdateUserMeMutation();
  const [activeTab, setActiveTab] = useState<Tab>("official");

  const activeChallengeId = challenge?.id;

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

  const isCommunityTab = activeTab === "community";
  const rawChallenges = isCommunityTab
    ? communityChallenges
    : officialChallenges;
  const challenges = useMemo(() => {
    if (!rawChallenges || !activeChallengeId) return rawChallenges;
    const active = rawChallenges.find((c) => c.id === activeChallengeId);
    if (!active) return rawChallenges;
    return [active, ...rawChallenges.filter((c) => c.id !== activeChallengeId)];
  }, [rawChallenges, activeChallengeId]);

  const tabs = useMemo<{ type: Tab; name: string }[]>(
    () => [
      {
        type: "official",
        name: intl.formatMessage({ defaultMessage: "Official" }),
      },
      {
        type: "community",
        name: intl.formatMessage({ defaultMessage: "Community" }),
      },
    ],
    [intl],
  );

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mx-6 mb-2">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="Challenges" />
        </ThemedText>
      </View>
      <View className="mb-4 flex-row gap-1 px-6">
        {tabs.map(({ type, name }) => {
          const isSelected = activeTab === type;
          return (
            <Pressable
              key={type}
              onPress={() => {
                if (type === "community" && !isAuthenticated) {
                  router.push("/join");
                  return;
                }
                setActiveTab(type);
              }}
              className={twMerge(
                "rounded py-2 px-2.5 mr-1 disabled:opacity-50",
                isSelected ? "bg-primary" : "bg-border",
              )}
            >
              <ThemedText
                className={twMerge(
                  "font-medium text-foreground",
                  isSelected && "text-white",
                )}
              >
                {name}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {isCommunityTab && (
        <TouchableOpacity
          onPress={onCreateChallenge}
          className="mx-6 mb-4 flex-row items-center gap-2 rounded border-2 border-border p-4"
        >
          <LucideIcon icon={Plus} size={20} />
          <ThemedText className="font-medium">
            <FormattedMessage defaultMessage="New challenge" />
          </ThemedText>
        </TouchableOpacity>
      )}
      <ScrollView
        contentContainerClassName="gap-2 px-6 pb-40"
        showsVerticalScrollIndicator={false}
      >
        {challenges?.map((challenge, index) => {
          // Use custom emoji for community challenges if available, otherwise use country flag
          const displayEmoji =
            "emoji" in challenge && challenge.emoji
              ? challenge.emoji
              : countryToEmoji(challenge.country);

          // Check if user owns this community challenge
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

        {!isCommunityTab && (
          <Link href="/user/suggestions" asChild>
            <ThemedText className="mt-4 text-center font-medium text-muted-foreground underline">
              <FormattedMessage defaultMessage="Suggest a new challenge" />
            </ThemedText>
          </Link>
        )}

        {isCommunityTab && (!challenges || challenges.length === 0) && (
          <View className="mt-8 items-center">
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="No community challenges yet. Be the first to create one!" />
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
