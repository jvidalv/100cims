import { formatDistanceToNow } from "date-fns";
import { ca, es, enUS } from "date-fns/locale";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";

import { SummitCard } from "@/components/summit";
import { Icon, Skeleton, ThemedText } from "@/components/ui/atoms";
import { ActionRow, AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { UserShareCard } from "@/components/user";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import {
  useAnyUserSummits,
  useUserChallenges,
  useUserMe,
  useUserOneGet,
  useUserProfile,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { captureAndShare, shareDeeplink } from "@/lib/share";

export default function UserScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { data: me } = useUserMe();
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const { data: user } = useUserOneGet({ userId });
  const { data: userDetails } = useUserProfile({ userId });
  const { data: summits, isPending: isPendingSummits } = useAnyUserSummits({
    userId,
  });
  const { data: challenges } = useUserChallenges({ userId });

  const isMe = me?.id === userId;

  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const sharedUsers = userDetails?.sharedUsers ?? [];
  const topSummits = [...(summits ?? [])]
    .sort(
      (a, b) => (parseInt(b.mountainHeight) || 0) - (parseInt(a.mountainHeight) || 0),
    )
    .slice(0, 10)
    .map((s) => ({ imageUrl: s.summitedImageUrl }));
  const remainingCount = Math.max(0, (summits?.length ?? 0) - 10);

  const handleShareLink = async () => {
    await shareDeeplink({
      intl,
      path: `user/${userId}`,
      messages: {
        en: `🏞️ Check out my profile on cims!\n💪`,
        es: `🏞️ Mira mi perfil en cims!\n💪`,
        ca: `🏞️ Mira el meu perfil a cims!\n💪`,
      },
    });
  };

  const handleShareSocial = async () => {
    if (!user || isSharing) return;
    setIsSharing(true);
    await captureAndShare({
      cardRef: shareCardRef,
      prefetchUrls: [
        user.imageUrl,
        ...topSummits.map((s) => s.imageUrl),
        ...sharedUsers.slice(0, 3).map((u) => u.imageUrl),
      ],
      dialogTitle: intl.formatMessage({ defaultMessage: "Share profile" }),
      fallback: handleShareLink,
      logTag: "user/share-card",
    });
    setIsSharing(false);
  };

  return (
    <>
    <ParallaxScrollView
      title={user ? getFullName(user) : "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      headerImage={
        user?.imageUrl ? (
          <Image
            source={{ uri: user?.imageUrl }}
            style={{ flex: 1, width: "100%", resizeMode: "cover" }}
          />
        ) : (
          <View className="flex-1 bg-primary" />
        )
      }
    >
      {!!user ? (
        <View className="mx-6 mb-6 gap-3">
          {!!user.town && (
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5">
                <Icon name="house.circle" muted size={18} />
                <ThemedText className="text-base font-medium">
                  {user?.town}
                </ThemedText>
              </View>
            </View>
          )}
          <View className="flex-row items-center gap-1.5">
            <Icon name="calendar" muted size={18} />
            <ThemedText className="text-base font-medium">
              <FormattedMessage
                defaultMessage="Member of cims for {duration}"
                values={{
                  duration: formatDistanceToNow(
                    new Date(user.createdAt as string | number),
                    {
                      locale:
                        intl.locale === "ca"
                          ? ca
                          : intl.locale === "es"
                            ? es
                            : enUS,
                    }
                  ),
                }}
              />
            </ThemedText>
          </View>
          {userDetails && !!userDetails?.sharedUsers?.length && (
            <View>
              <View className="mb-1 flex-row items-center gap-1.5">
                <Icon name="person.3.fill" muted size={18} />
                <ThemedText className="text-base font-medium">
                  <FormattedMessage defaultMessage="People" />
                </ThemedText>
              </View>
              <View>
                <AvatarGroup
                  size="sm"
                  items={userDetails.sharedUsers.map((person) => ({
                    name: getFullName(person),
                    imageUrl: person.imageUrl,
                    id: person.userId,
                  }))}
                  onPress={({ id }) => router.push(`/user/${id}`)}
                />
              </View>
            </View>
          )}
          {isMe && (
            <View className="mt-4 gap-2">
              <ThemedText className="text-2xl font-semibold">
                <FormattedMessage defaultMessage="Actions" />
              </ThemedText>
              <Link href="/user/me" asChild>
                <ActionRow
                  iconName="square.and.pencil"
                  iconSize={18}
                  intent="primary"
                >
                  <FormattedMessage defaultMessage="Edit profile" />
                </ActionRow>
              </Link>
              <ActionRow
                onPress={handleShareLink}
                iconName="link"
                intent="muted"
              >
                <FormattedMessage defaultMessage="Share link" />
              </ActionRow>
              <ActionRow
                onPress={handleShareSocial}
                iconName="photo"
                intent="blue"
                disabled={isSharing || isPendingSummits}
                iconOverride={
                  isSharing ? <ActivityIndicator size="sm" /> : undefined
                }
              >
                <FormattedMessage defaultMessage="Share on social" />
              </ActionRow>
            </View>
          )}
        </View>
      ) : (
        <View className="mx-6 ">
          <Skeleton className="mb-6 h-24 w-full" />
        </View>
      )}
      <View className="relative flex-row items-center justify-between">
        <ThemedText className="mb-4 px-6 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Summits" />
          <ThemedText className="font-medium text-muted-foreground">
            {"  "}
            {summits?.length}
          </ThemedText>
        </ThemedText>
      </View>
      <View className="flex flex-row flex-wrap px-6">
        {isPendingSummits && (
          <>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
          </>
        )}
        {!summits?.length && !isPendingSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No summits yet." />
          </ThemedText>
        )}
        {summits?.map((summit, index) => (
          <SummitCard
            key={summit.summitId}
            summit={summit}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: summit.summitId },
              })
            }
            onParticipantPress={(userId) => router.push(`/user/${userId}`)}
          />
        ))}
      </View>
      {challenges && challenges.length > 0 && (
        <View className="mt-8 gap-2 px-6">
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Challenges" />
          </ThemedText>
          {challenges.map((challenge) => {
            const displayEmoji =
              challenge.emoji || countryToEmoji(challenge.country);
            return (
              <TouchableOpacity
                key={challenge.id}
                className="flex-row items-center gap-2"
                onPress={() => router.push(`/challenge/${challenge.id}`)}
              >
                <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <ThemedText className="text-base" style={{ lineHeight: 16 }}>
                    {displayEmoji}
                  </ThemedText>
                </View>
                <ThemedText className="text-muted-foreground">
                  {challenge.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ParallaxScrollView>
      {isMe && !!user && (
        <View
          collapsable={false}
          pointerEvents="none"
          style={{ position: "absolute", left: -10000, top: 0 }}
        >
          <UserShareCard
            ref={shareCardRef}
            fullName={getFullName(user)}
            profileImageUrl={user.imageUrl}
            topSummits={topSummits}
            remainingCount={remainingCount}
          />
        </View>
      )}
    </>
  );
}
