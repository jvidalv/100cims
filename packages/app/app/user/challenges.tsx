import { Redirect, useRouter } from "expo-router";
import { Flag, Mountain, Plus, Star } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, View } from "react-native";

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
  useBlurredScreenHeaderHeight,
  BlurredScreenHeader,
  ChallengeRowMinimal,
} from "@/components/ui/molecules";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import {
  useCommunityChallengeDelete,
  useCommunityChallengesList,
} from "@/domains/community-challenge/community-challenge.api";
import {
  useUpdateUserMeMutation,
  useUserChallenges,
  useUserMe,
} from "@/domains/user/user.api";

export default function UserChallengesScreen() {
  const router = useRouter();
  const intl = useIntl();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const { isAuthenticated } = useAuth();

  const { data: challenges, isPending: isPendingChallenges } =
    useCommunityChallengesList({ filter: "mine" });
  const { data: activeChallenge } = useActiveChallenge();
  const { data: user } = useUserMe();
  const {
    mutateAsync: updateUser,
    isPending: isUpdating,
    variables,
  } = useUpdateUserMeMutation();
  const { mutateAsync: deleteChallenge } = useCommunityChallengeDelete();

  // Per-challenge summit counts for the current user; drives the % badge on
  // each row. Endpoint only returns challenges with summitCount >= 1, so
  // missing entries default to zero.
  const { data: userChallenges } = useUserChallenges({
    userId: user?.id ?? "",
    enabled: !!user?.id,
  });
  const summitedByChallengeId = useMemo(() => {
    const map = new Map<string, number>();
    if (userChallenges) {
      for (const uc of userChallenges) map.set(uc.id, uc.summitCount);
    }
    return map;
  }, [userChallenges]);

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

  const onChallengeSelect = async (id: string) => {
    await updateUser({ activeChallengeId: id });
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage
            defaultMessage="My challenges ({count}/{max})"
            values={{ count: challenges?.length ?? 0, max: 5 }}
          />
        </ThemedText>
      </BlurredScreenHeader>

      <ScrollView
        contentContainerStyle={{
          paddingTop: blurredHeaderHeight,
          paddingHorizontal: 24,
          paddingBottom: 112,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isPendingChallenges && (
          <>
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </>
        )}

        {!isPendingChallenges && !challenges?.length && (
          <View className="relative rounded border-2 border-border p-4">
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

        {challenges?.map((item) => (
          <ChallengeRowMinimal
            key={item.id}
            name={item.name}
            emoji={item.emoji || countryToEmoji(item.country)}
            peakImageUrl={item.peakImageUrl}
            totalMountains={item.totalMountains}
            totalUsers={item.totalUsers}
            summitedCount={summitedByChallengeId.get(item.id) ?? 0}
            isPublic={item.isPublic}
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

        <View className="mt-4 gap-2">
          <ActionRow
            icon={Plus}
            onPress={() => router.push("/challenge/create")}
          >
            <FormattedMessage defaultMessage="New challenge" />
          </ActionRow>
          <ActionRow icon={Flag} onPress={() => router.push("/challenges")}>
            <FormattedMessage defaultMessage="Official challenges" />
          </ActionRow>
          <ActionRow
            icon={Mountain}
            onPress={() => router.push("/user/mountains")}
          >
            <FormattedMessage defaultMessage="My mountains" />
          </ActionRow>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
