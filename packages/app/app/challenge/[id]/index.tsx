import { useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, Image, View, Share } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  ThemedText,
  Icon,
  Button,
  Avatar,
  Skeleton,
  ThemedView,
} from "@/components/ui/atoms";
import { MountainItemList } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import {
  useActiveChallenge,
  useChallengeDetail,
} from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { useUpdateUserMeMutation } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getUrlDeeplink } from "@/lib/deeplink";
import { isIOS } from "@/lib/device";
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

  const isActiveChallenge = activeChallenge?.id === id;

  useEffect(() => {
    if (!isIOS) return;

    setStatusBarStyle("light", true);
    return () => {
      setStatusBarStyle(colorScheme === "dark" ? "light" : "dark", true);
    };
  }, [colorScheme]);

  const handleShare = async () => {
    if (!challenge) return;
    const locale = intl.locale;
    const messages = {
      en: `🏔️ Check out the ${challenge.name} challenge on cims!\n\n${getUrlDeeplink(`challenge/${id}`)}`,
      es: `🏔️ Mira el reto ${challenge.name} en cims!\n\n${getUrlDeeplink(`challenge/${id}`)}`,
      ca: `🏔️ Mira el repte ${challenge.name} a cims!\n\n${getUrlDeeplink(`challenge/${id}`)}`,
    };

    const msg = messages[locale as "ca" | "es" | "en"] || messages.en;

    await Share.share({ message: msg });
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
      parallaxRightElement={
        <View className="flex-row items-end gap-4 opacity-80">
          <TouchableOpacity onPress={handleShare}>
            <Icon
              name="square.and.arrow.up"
              color="white"
              size={24}
              animationSpec={{ effect: { type: "bounce" } }}
            />
          </TouchableOpacity>
        </View>
      }
      headerRightElement={
        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center justify-end pb-3 pr-4"
        >
          <Icon
            name="square.and.arrow.up"
            color="white"
            animationSpec={{ effect: { type: "bounce" } }}
          />
        </TouchableOpacity>
      }
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
              <Icon name="checkmark.seal.fill" color="#f43f5e" size={18} />
              <ThemedText className="text-base font-semibold text-primary">
                <FormattedMessage defaultMessage="Official" />
              </ThemedText>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <Icon name="mountain.2.fill" muted size={20} />
          <ThemedText className="text-xl font-medium">
            {challenge.totalMountains}{" "}
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Mountains" />
            </ThemedText>
          </ThemedText>
        </View>
        {challenge.description && (
          <View className="flex-row gap-2">
            <Icon name="text.alignleft" muted size={20} />
            <ThemedText className="flex-1 text-base text-muted-foreground">
              {challenge.description}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Switch Challenge Button */}
      <View>
        {isActiveChallenge ? (
          <View className="flex-row items-center justify-center gap-2 rounded border-2 border-primary bg-primary/10 p-4">
            <Icon name="checkmark.circle.fill" color="#f43f5e" size={20} />
            <ThemedText className="font-semibold text-primary">
              <FormattedMessage defaultMessage="Active challenge" />
            </ThemedText>
          </View>
        ) : (
          <Button
            onPress={handleSwitchChallenge}
            disabled={!challenge.isPublic || isUpdating}
            className={!challenge.isPublic ? "opacity-50" : ""}
          >
            {isUpdating ? (
              <ActivityIndicator color="white" />
            ) : (
              <FormattedMessage defaultMessage="Switch to this challenge" />
            )}
          </Button>
        )}
        {!challenge.isPublic && !isActiveChallenge && (
          <ThemedText className="mt-2 text-center text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="This challenge is private" />
          </ThemedText>
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
                <ThemedText className="text-xs font-bold">
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
