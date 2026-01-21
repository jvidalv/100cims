import { analytics } from "@jvidalv/react-analytics";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Button,
  Icon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ChallengeListItem } from "@/components/ui/molecules";
import {
  useActiveChallenge,
  useChallengesGet,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useCommunityChallengesList } from "@/domains/community-challenge/community-challenge.api";
import { useUpdateUserMeMutation, useUserMe } from "@/domains/user/user.api";
import { isAndroid } from "@/lib/device";

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
    analytics.action("selected-challenge", { challengeId: id });
    await updateUser({ activeChallengeId: id });
    router.dismiss();
  };

  const onCreateChallenge = () => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    router.back();
    router.push("/user/challenges");
  };

  const challenges =
    activeTab === "official" ? officialChallenges : communityChallenges;

  return (
    <ThemedView
      className={twMerge("flex-1 gap-6 px-4 pt-6", isAndroid && "pt-24")}
    >
      <ScrollView
        contentContainerClassName="gap-2 pb-40"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <ThemedView className="pb-2">
          <ThemedText className="text-4xl font-black">
            <FormattedMessage defaultMessage="Challenges" />
          </ThemedText>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="You can switch between them freely, progress is saved." />
          </ThemedText>
        </ThemedView>

        {/* Tab Selector */}
        <View className="mb-2 flex-row gap-2">
          <TouchableOpacity
            onPress={() => setActiveTab("official")}
            className={twMerge(
              "flex-1 rounded-lg border-2 border-border p-3",
              activeTab === "official" && "border-primary bg-primary/10"
            )}
          >
            <ThemedText
              className={twMerge(
                "text-center font-semibold",
                activeTab === "official" && "text-primary"
              )}
            >
              🏆 {intl.formatMessage({ defaultMessage: "Official" })}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("community")}
            className={twMerge(
              "flex-1 rounded-lg border-2 border-border p-3",
              activeTab === "community" && "border-primary bg-primary/10"
            )}
          >
            <ThemedText
              className={twMerge(
                "text-center font-semibold",
                activeTab === "community" && "text-primary"
              )}
            >
              👥 {intl.formatMessage({ defaultMessage: "Community" })}
            </ThemedText>
          </TouchableOpacity>
        </View>

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
              totalMountains={challenge.totalMountains}
              index={index}
              isSelected={activeChallengeId === challenge.id}
              onPress={() => onChallengeSelect(challenge.id)}
              onEditPress={
                isOwner
                  ? () =>
                      router.push({
                        pathname: "/community-challenge/[id]/edit",
                        params: { id: challenge.id },
                      })
                  : undefined
              }
              rightElement={
                isPending && variables?.activeChallengeId === challenge.id ? (
                  <ActivityIndicator className="opacity-30" />
                ) : "totalUsers" in challenge &&
                  Number(challenge.totalUsers) > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <ThemedText className="font-medium text-muted-foreground">
                      {challenge.totalUsers}
                    </ThemedText>
                    <Icon name="person.2.fill" muted size={18} />
                  </View>
                ) : null
              }
            />
          );
        })}

        {activeTab === "official" && (
          <Link href="/user/suggestions" asChild>
            <ThemedText className="mt-4 text-center font-medium text-muted-foreground underline">
              <FormattedMessage defaultMessage="Suggest a new challenge" />
            </ThemedText>
          </Link>
        )}

        {activeTab === "community" && (
          <>
            {(!challenges || challenges.length === 0) && (
              <View className="mt-8 items-center">
                <ThemedText className="text-center text-muted-foreground">
                  <FormattedMessage defaultMessage="No community challenges yet. Be the first to create one!" />
                </ThemedText>
              </View>
            )}
            <Button
              intent="outline"
              iconName="plus"
              iconSize={16}
              onPress={onCreateChallenge}
              className="mt-4"
            >
              <FormattedMessage defaultMessage="Create Challenge" />
            </Button>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}
