import { useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  AlignLeft,
  BadgeCheck,
  CircleCheck,
  Mountain,
  Share as ShareIcon,
  Target,
  Trash2,
  Trophy,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, TouchableOpacity, Image, View } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  ThemedText,
  LucideIcon,
  Avatar,
  Skeleton,
  ThemedView,
} from "@/components/ui/atoms";
import { ActionRow, MountainItemList } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import {
  useActiveChallenge,
  useAdminDeleteChallengeMutation,
  useChallengeDetail,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useIsAdmin, useUpdateUserMeMutation } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { isIOS } from "@/lib/device";
import { shareDeeplink } from "@/lib/share";
import { getInitials } from "@/lib/strings";

export default function ChallengeDetailScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: challenge, isPending } = useChallengeDetail({ id });
  const { data: activeChallenge } = useActiveChallenge();
  const { mutateAsync: updateUser, isPending: isUpdating } =
    useUpdateUserMeMutation();
  const isAdmin = useIsAdmin();
  const { mutateAsync: adminDeleteChallenge } =
    useAdminDeleteChallengeMutation();

  const isActiveChallenge = activeChallenge?.id === id;

  const handleAdminDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete as admin" }),
      intl.formatMessage({
        defaultMessage: "This removes the challenge for everyone. Continue?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Yes" }),
          style: "destructive",
          onPress: async () => {
            await adminDeleteChallenge({ challengeId: id });
            router.back();
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!isIOS) return;

    setStatusBarStyle("light", true);
    return () => {
      setStatusBarStyle(colorScheme === "dark" ? "light" : "dark", true);
    };
  }, [colorScheme]);

  const handleShare = async () => {
    if (!challenge) return;
    await shareDeeplink({
      intl,
      path: `challenge/${id}`,
      messages: {
        en: `🏔️ Check out the ${challenge.name} challenge on cims!`,
        es: `🏔️ Mira el reto ${challenge.name} en cims!`,
        ca: `🏔️ Mira el repte ${challenge.name} a cims!`,
      },
    });
  };

  const handleSwitchChallenge = async () => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    await updateUser({ activeChallengeId: id });
  };

  // Get tallest mountain for header image
  const tallestMountain = challenge?.mountains?.[0];
  const headerImageUrl = tallestMountain?.imageUrl || challenge?.imageUrl;

  // Display emoji
  const displayEmoji =
    challenge?.emoji ||
    (challenge?.country ? countryToEmoji(challenge.country) : "🏔️");

  const usersToShow = challenge?.users || [];
  const totalUsers = challenge?.totalUsers || 0;
  const extraUsersCount = totalUsers > 100 ? totalUsers - 100 : 0;

  const mountainsToShow = challenge?.mountains?.slice(0, 3) || [];
  const extraMountainsCount =
    (challenge?.totalMountains || 0) > 3
      ? (challenge?.totalMountains || 0) - 3
      : 0;

  if (isPending) {
    return (
      <ThemedView className="flex-1">
        {/* Header skeleton */}
        <Skeleton className="h-64 w-full" style={{ borderRadius: 0 }} />
        {/* Content skeletons */}
        <View className="gap-6 px-6 py-6">
          {/* Details skeleton */}
          <View className="gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-16 w-full" />
          </View>
          {/* Button skeleton */}
          <Skeleton className="h-14 w-full rounded" />
          {/* Participants skeleton */}
          <View className="gap-3">
            <Skeleton className="h-8 w-32" />
            <View className="flex-row gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </View>
          </View>
          {/* Mountains skeleton */}
          <View className="gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-20 w-full rounded" />
          </View>
        </View>
      </ThemedView>
    );
  }

  if (!challenge) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ThemedText className="text-muted-foreground">
          <FormattedMessage defaultMessage="Challenge not found" />
        </ThemedText>
      </View>
    );
  }

  return (
    <ParallaxScrollView
      title={challenge.name}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="gap-6 px-6 py-6"
      headerImage={
        headerImageUrl ? (
          <Image
            source={{ uri: headerImageUrl, cache: "force-cache" }}
            style={{ flex: 1, width: "100%" }}
            className="bg-gray-200 dark:bg-gray-900"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-primary">
            <ThemedText className="text-6xl">{displayEmoji}</ThemedText>
          </View>
        )
      }
    >
      {/* Details Section */}
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <ThemedText className="text-2xl">{displayEmoji}</ThemedText>
          <ThemedText className="text-xl font-medium">
            {challenge.country}
          </ThemedText>
          {challenge.isOfficial && (
            <View className="flex-row items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1.5">
              <LucideIcon icon={BadgeCheck} primary size={18} />
              <ThemedText className="text-base font-semibold text-primary">
                <FormattedMessage defaultMessage="Official" />
              </ThemedText>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <LucideIcon icon={Mountain} muted size={20} />
          <ThemedText className="text-xl font-medium">
            {challenge.totalMountains}{" "}
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Mountains" />
            </ThemedText>
          </ThemedText>
        </View>
        {challenge.description && (
          <View className="flex-row gap-2">
            <LucideIcon icon={AlignLeft} muted size={20} />
            <ThemedText className="flex-1 text-base text-muted-foreground">
              {challenge.description}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View className="gap-2">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Actions" />
        </ThemedText>

        <ActionRow
          onPress={isActiveChallenge ? undefined : handleSwitchChallenge}
          disabled={isActiveChallenge || !challenge.isPublic || isUpdating}
          icon={isActiveChallenge ? CircleCheck : Target}
          intent={isActiveChallenge ? "emerald" : "primary"}
          iconOverride={isUpdating ? <ActivityIndicator /> : undefined}
        >
          {isActiveChallenge ? (
            <FormattedMessage defaultMessage="Active challenge" />
          ) : (
            <FormattedMessage defaultMessage="Set as active challenge" />
          )}
        </ActionRow>

        <ActionRow
          onPress={() => router.push("/hiscores")}
          icon={Trophy}
          intent="gold"
        >
          <FormattedMessage defaultMessage="See hiscores" />
        </ActionRow>

        <ActionRow
          onPress={handleShare}
          icon={ShareIcon}
          intent="muted"
        >
          <FormattedMessage defaultMessage="Share with your friends" />
        </ActionRow>

        {!challenge.isPublic && !isActiveChallenge && (
          <ThemedText className="text-center text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="This challenge is private" />
          </ThemedText>
        )}
        {isAdmin && !challenge.isOfficial && (
          <ActionRow
            onPress={handleAdminDelete}
            icon={Trash2}
            intent="danger"
          >
            <FormattedMessage defaultMessage="Delete (admin)" />
          </ActionRow>
        )}
      </View>

      {/* Users Section */}
      {usersToShow.length > 0 && (
        <View className="gap-3">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Participants" />
            <ThemedText className="text-lg font-medium text-muted-foreground">
              {"  "}
              {totalUsers}
            </ThemedText>
          </ThemedText>
          <View className="flex-row flex-wrap gap-2">
            {usersToShow.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => router.push(`/user/${user.id}`)}
              >
                <Avatar
                  size="sm"
                  imageUrl={user.imageUrl}
                  initials={getInitials(getFullName(user))}
                  className="border border-background"
                />
              </TouchableOpacity>
            ))}
            {extraUsersCount > 0 && (
              <View className="size-10 items-center justify-center rounded-full bg-muted">
                <ThemedText
                  className="text-xs font-bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  +{extraUsersCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Mountains Section */}
      <View className="mb-32 gap-3">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Mountains" />
        </ThemedText>
        <View className="gap-3">
          {mountainsToShow.map((mountain) => (
            <MountainItemList
              key={mountain.id}
              name={mountain.name}
              height={mountain.height}
              slug={mountain.slug}
              imageUrl={mountain.imageUrl}
              essential={mountain.essential}
              location={mountain.location}
            />
          ))}
          {extraMountainsCount > 0 && (
            <View className="items-center rounded border-2 border-dashed border-border p-4">
              <ThemedText className="font-medium text-muted-foreground">
                +{extraMountainsCount}{" "}
                <FormattedMessage defaultMessage="more mountains" />
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </ParallaxScrollView>
  );
}
