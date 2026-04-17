import { Redirect, useRouter } from "expo-router";
import { Plus, Star } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  ChallengeListItem,
  MountainItemListAsTouchable,
  ScreenHeader,
} from "@/components/ui/molecules";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import {
  useCommunityChallengeDelete,
  useCommunityChallengesList,
} from "@/domains/community-challenge/community-challenge.api";
import { useMyMountains } from "@/domains/mountain/mountain.api";
import { useUpdateUserMeMutation } from "@/domains/user/user.api";
import { MountainWithChallengeCount } from "@/types/mountain";

type Tab = "challenges" | "mountains";

export default function UserChallengesScreen() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("challenges");

  const { data: challenges, isPending: isPendingChallenges } =
    useCommunityChallengesList({ filter: "mine" });
  const { data: activeChallenge } = useActiveChallenge();
  const {
    mutateAsync: updateUser,
    isPending: isUpdating,
    variables,
  } = useUpdateUserMeMutation();
  const { mutateAsync: deleteChallenge } = useCommunityChallengeDelete();

  const handleDeleteChallenge = useCallback(
    (id: string) => {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Delete challenge" }),
        intl.formatMessage({
          defaultMessage:
            "Are you sure you want to delete this challenge? This action cannot be undone.",
        }),
        [
          {
            text: intl.formatMessage({ defaultMessage: "Cancel" }),
            style: "cancel",
          },
          {
            text: intl.formatMessage({ defaultMessage: "Delete" }),
            style: "destructive",
            onPress: async () => {
              try {
                await deleteChallenge({ id });
              } catch {
                Alert.alert(
                  intl.formatMessage({
                    defaultMessage: "Failed to delete challenge",
                  }),
                );
              }
            },
          },
        ],
      );
    },
    [deleteChallenge, intl],
  );

  const { data: mountains, isLoading: isLoadingMountains } = useMyMountains();

  const onChallengeSelect = async (id: string) => {
    await updateUser({ activeChallengeId: id });
  };

  const { publicChallenges, privateChallenges } = useMemo(() => {
    const publicList = challenges?.filter((c) => c.isPublic) ?? [];
    const privateList = challenges?.filter((c) => !c.isPublic) ?? [];
    return { publicChallenges: publicList, privateChallenges: privateList };
  }, [challenges]);

  const challengesCount = challenges?.length ?? 0;
  const mountainsCount = mountains?.length ?? 0;

  const tabs = useMemo<{ type: Tab; name: string }[]>(
    () => [
      {
        type: "challenges",
        name: `${intl.formatMessage({ defaultMessage: "Challenges" })} (${challengesCount})`,
      },
      {
        type: "mountains",
        name: `${intl.formatMessage({ defaultMessage: "Mountains" })} (${mountainsCount})`,
      },
    ],
    [intl, challengesCount, mountainsCount],
  );

  const renderMountain = useCallback(
    ({ item }: { item: MountainWithChallengeCount }) => (
      <View className="px-6 py-2">
        <MountainItemListAsTouchable
          onPress={() =>
            router.push({
              pathname: "/mountain/[slug]/edit",
              params: { slug: item.slug },
            })
          }
          name={item.name}
          location={item.location}
          imageUrl={item.imageUrl}
          essential={item.essential}
          latitude={item.latitude}
          longitude={item.longitude}
          slug={item.slug}
          height={item.height}
        />
      </View>
    ),
    [router],
  );

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  const isChallengesTab = activeTab === "challenges";

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-4 px-6">
        <ThemedText className="text-4xl font-bold">
          {isChallengesTab ? (
            <FormattedMessage defaultMessage="My challenges" />
          ) : (
            <FormattedMessage defaultMessage="My mountains" />
          )}
        </ThemedText>
      </View>
      <View className="mb-4 flex-row gap-1 px-6">
        {tabs.map(({ type, name }) => {
          const isSelected = activeTab === type;
          return (
            <Pressable
              key={type}
              onPress={() => setActiveTab(type)}
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

      {isChallengesTab && (
        <View className="mx-6 mb-4">
          <ActionRow
            icon={Plus}
            size="lg"
            intent="primary"
            onPress={() => router.push("/challenge/create")}
          >
            <FormattedMessage defaultMessage="New challenge" />
          </ActionRow>
        </View>
      )}

      {isChallengesTab ? (
        <ScrollView contentContainerClassName="gap-3 px-6 pb-28">
          {isPendingChallenges && (
            <>
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
              <Skeleton className="h-16 rounded" />
            </>
          )}
          {!isPendingChallenges && !challenges?.length && (
            <View className="relative mt-auto rounded border-2 border-border p-4">
              <View className="absolute right-2 top-2">
                <LucideIcon icon={Star} color="gold" size={24} />
              </View>
              <ThemedText className="mb-1 font-semibold">
                <FormattedMessage defaultMessage="Do you know?" />
              </ThemedText>
              <ThemedText>
                <FormattedMessage defaultMessage="You can now create your own challenges and also your mountains, other people can join these challenges!" />
              </ThemedText>
            </View>
          )}

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
                  peakImageUrl={item.peakImageUrl}
                  totalMountains={item.totalMountains}
                  totalUsers={item.totalUsers}
                  index={index}
                  isSelected={activeChallenge?.id === item.id}
                  onPress={() => onChallengeSelect(item.id)}
                  onEditPress={() =>
                    router.push({
                      pathname: "/challenge/[id]/edit",
                      params: { id: item.id },
                    })
                  }
                  onDeletePress={() => handleDeleteChallenge(item.id)}
                  rightElement={
                    isUpdating && variables?.activeChallengeId === item.id ? (
                      <ActivityIndicator className="opacity-30" />
                    ) : null
                  }
                />
              ))}
            </>
          )}

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
                  peakImageUrl={item.peakImageUrl}
                  totalMountains={item.totalMountains}
                  totalUsers={item.totalUsers}
                  index={publicChallenges.length + index}
                  isSelected={activeChallenge?.id === item.id}
                  onPress={() => onChallengeSelect(item.id)}
                  onEditPress={() =>
                    router.push({
                      pathname: "/challenge/[id]/edit",
                      params: { id: item.id },
                    })
                  }
                  onDeletePress={() => handleDeleteChallenge(item.id)}
                  rightElement={
                    isUpdating && variables?.activeChallengeId === item.id ? (
                      <ActivityIndicator className="opacity-30" />
                    ) : null
                  }
                />
              ))}
            </>
          )}

          {!isPendingChallenges && (
            <ThemedText className="mt-4 text-center text-sm text-muted-foreground">
              <FormattedMessage
                defaultMessage="{count} of {max} challenges"
                values={{ count: challenges?.length ?? 0, max: 5 }}
              />
            </ThemedText>
          )}
        </ScrollView>
      ) : isLoadingMountains ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : !mountains?.length ? (
        <View className="px-6">
          <View className="relative rounded border-2 border-border p-4">
            <View className="absolute right-2 top-2">
              <LucideIcon icon={Star} color="gold" size={24} />
            </View>
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="Do you know?" />
            </ThemedText>
            <ThemedText>
              <FormattedMessage defaultMessage="No mountains yet. Create mountains when adding them to a challenge." />
            </ThemedText>
          </View>
        </View>
      ) : (
        <FlatList
          data={mountains}
          keyExtractor={(item) => item.id}
          renderItem={renderMountain}
          contentContainerClassName="pb-28"
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}
