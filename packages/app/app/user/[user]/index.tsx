import { format } from "date-fns/format";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  House,
  Image as ImageIcon,
  Link as LinkIcon,
  Mountain,
  SquarePen,
  UserMinus,
  UserPlus,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { SummitCard } from "@/components/summit";
import {
  ActivityIndicator,
  LucideIcon,
  Skeleton,
  ThemedText,
} from "@/components/ui/atoms";
import {
  ActionRow,
  PersonRow,
  SharePreviewModal,
} from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { UserShareCard } from "@/components/user";
import {
  useAddUserPerson,
  useAnyUserAllSummits,
  useAnyUserSummits,
  useRemoveUserPerson,
  useUserMe,
  useUserOneGet,
  useUserPeople,
  useUserProfile,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getDateFnsLocale, getLocale } from "@/lib/locale";
import { logError } from "@/lib/log-error";
import { captureShareCard, shareDeeplink } from "@/lib/share";

export default function UserScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: me } = useUserMe();
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const { data: user } = useUserOneGet({ userId });
  const { data: userDetails } = useUserProfile({ userId });

  const isMe = me?.id === userId;

  // Paginated summits — 24 per page, infinite-scrolled into view as the
  // user scrolls toward the bottom of the parallax scroll view.
  const {
    data: summitsPages,
    isPending: isPendingSummits,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnyUserAllSummits({ userId });
  const summits = useMemo(
    () => summitsPages?.pages.flatMap((p) => p.items) ?? [],
    [summitsPages],
  );
  const totalSummits = summitsPages?.pages[0]?.pagination.totalItems ?? 0;
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  // Share-card needs the full summit list (sorted by height, top 10) for
  // the "Share on social" composition. Only runs when the viewer is the
  // profile owner — the share card is also only rendered in that case
  // (see the `isMe && !!user` guard near the end). The legacy
  // non-paginated endpoint stays around exactly for this.
  const { data: allSummitsForShare, isPending: isPendingShareSummits } =
    useAnyUserSummits({
      userId,
      enabled: isMe,
    });

  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUri, setShareUri] = useState<string | null>(null);

  const sharedUsers = userDetails?.sharedUsers ?? [];
  // Share card uses the full (legacy) list when we're the profile owner —
  // we need every summit so the "top 10 by height" sort actually reflects
  // every cim, not just the first page.
  const topSummits = [...(allSummitsForShare ?? [])]
    .sort(
      (a, b) => (parseInt(b.mountainHeight) || 0) - (parseInt(a.mountainHeight) || 0),
    )
    .slice(0, 10)
    .map((s) => ({ imageUrl: s.summitedImageUrl }));
  const remainingCount = Math.max(0, (allSummitsForShare?.length ?? 0) - 10);

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
    const uri = await captureShareCard({
      cardRef: shareCardRef,
      prefetchUrls: [
        user.imageUrl,
        ...topSummits.map((s) => s.imageUrl),
        ...sharedUsers.slice(0, 3).map((u) => u.imageUrl),
      ],
      logTag: "user/share-card",
    });
    setIsSharing(false);
    if (uri) {
      setShareUri(uri);
    } else {
      await handleShareLink();
    }
  };

  const { data: myPeople } = useUserPeople();
  const isMyPerson = !isMe && !!myPeople?.some((p) => p.userId === userId);
  const addPerson = useAddUserPerson();
  const removePerson = useRemoveUserPerson();
  const [isTogglingPerson, setIsTogglingPerson] = useState(false);

  const handleAddPerson = async () => {
    if (isTogglingPerson) return;
    setIsTogglingPerson(true);
    try {
      await addPerson.mutateAsync(userId);
    } catch (error) {
      logError(error, "user/profile/add-person");
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    } finally {
      setIsTogglingPerson(false);
    }
  };

  const handleRemovePerson = () => {
    if (isTogglingPerson) return;
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Remove from your people?" }),
      intl.formatMessage({
        defaultMessage: "Are you sure you want to continue?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Remove" }),
          style: "destructive",
          onPress: async () => {
            setIsTogglingPerson(true);
            try {
              await removePerson.mutateAsync(userId);
            } catch (error) {
              logError(error, "user/profile/remove-person");
              Alert.alert(
                intl.formatMessage({ defaultMessage: "Something went wrong" }),
              );
            } finally {
              setIsTogglingPerson(false);
            }
          },
        },
      ],
    );
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <>
    <ParallaxScrollView
      title={user ? getFullName(user) : "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      onEndReached={handleEndReached}
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
        <View className="mx-6 mb-6 gap-2">
          {!!user.town && <InfoRow icon={House}>{user.town}</InfoRow>}
          <InfoRow icon={Calendar}>
            <FormattedMessage
              defaultMessage="Member since {date}"
              values={{
                date: format(
                  new Date(user.createdAt as string | number),
                  getLocale() === "en" ? "MMMM yyyy" : "MMMM 'de' yyyy",
                  { locale: getDateFnsLocale() },
                ),
              }}
            />
          </InfoRow>
          {isMe && (
            <View className="mt-4 gap-2">
              <ThemedText className="text-2xl font-semibold">
                <FormattedMessage defaultMessage="Actions" />
              </ThemedText>
              <Link href="/user/me" asChild>
                <ActionRow
                  icon={SquarePen}
                  iconSize={18}
                  intent="primary"
                >
                  <FormattedMessage defaultMessage="Edit profile" />
                </ActionRow>
              </Link>
              <ActionRow
                onPress={handleShareLink}
                icon={LinkIcon}
                intent="muted"
              >
                <FormattedMessage defaultMessage="Share link" />
              </ActionRow>
              <ActionRow
                onPress={handleShareSocial}
                icon={ImageIcon}
                intent="blue"
                disabled={isSharing || isPendingShareSummits}
                iconOverride={
                  isSharing ? <ActivityIndicator size="sm" /> : undefined
                }
              >
                <FormattedMessage defaultMessage="Share on social" />
              </ActionRow>
            </View>
          )}
          {!isMe && (
            <View className="mt-4 gap-2">
              <ThemedText className="text-2xl font-semibold">
                <FormattedMessage defaultMessage="Actions" />
              </ThemedText>
              {isMyPerson ? (
                <ActionRow
                  onPress={handleRemovePerson}
                  icon={UserMinus}
                  intent="danger"
                  disabled={isTogglingPerson}
                  iconOverride={
                    isTogglingPerson ? (
                      <ActivityIndicator size="sm" color="#ef4444" />
                    ) : undefined
                  }
                >
                  <FormattedMessage defaultMessage="Remove from your people" />
                </ActionRow>
              ) : (
                <ActionRow
                  onPress={handleAddPerson}
                  icon={UserPlus}
                  intent="emerald"
                  disabled={isTogglingPerson}
                  iconOverride={
                    isTogglingPerson ? (
                      <ActivityIndicator size="sm" color="#10b981" />
                    ) : undefined
                  }
                >
                  <FormattedMessage defaultMessage="Add to your people" />
                </ActionRow>
              )}
            </View>
          )}
        </View>
      ) : (
        <View className="mx-6 mb-6 gap-2">
          {/* Info rows (Town + Member since) */}
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </View>
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </View>
          {/* Actions section */}
          <View className="mt-4 gap-2">
            <Skeleton className="mb-1 h-8 w-24" />
            {[0, 1, 2].map((i) => (
              <View key={i} className="flex-row items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-5 w-36" />
              </View>
            ))}
          </View>
        </View>
      )}
      {userDetails && !!userDetails.sharedUsers?.length && (
        <View className="mb-6 gap-2 px-6">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="People" />
          </ThemedText>
          {userDetails.sharedUsers.map((person) => (
            <PersonRow
              key={person.userId}
              person={person}
              avatarSize="xs"
              onPress={() => router.push(`/user/${person.userId}`)}
              trailing={
                <View className="flex-row items-center gap-1">
                  <ThemedText className="text-base text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="{count} cims"
                      values={{ count: person.summitsTogetherCount }}
                    />
                  </ThemedText>
                  <LucideIcon icon={Mountain} size={14} muted />
                </View>
              }
            />
          ))}
        </View>
      )}
      <View className="relative flex-row items-center justify-between">
        <ThemedText className="mb-4 px-6 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Summits" />
          <ThemedText className="font-medium text-muted-foreground">
            {"  "}
            {/* Suppress the count until page 1 lands — otherwise we'd flash
                "Summits 0" before the real total resolves, the skeleton
                grid below is the real loading indicator. */}
            {isPendingSummits ? "" : totalSummits}
          </ThemedText>
        </ThemedText>
      </View>
      <View className="flex flex-row flex-wrap px-6">
        {isPendingSummits &&
          Array.from({ length: 8 }).map((_, i) => (
            <View key={i} className={i % 2 === 0 ? "w-1/2" : "w-1/2 pl-1.5"}>
              <Skeleton
                className="mb-2 w-full"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
          ))}
        {!summits.length && !isPendingSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No summits yet." />
          </ThemedText>
        )}
        {summits.map((summit, index) => (
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
      {isFetchingNextPage && (
        <View className="py-4">
          <ActivityIndicator />
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
      <SharePreviewModal
        visible={!!shareUri}
        imageUri={shareUri}
        dialogTitle={intl.formatMessage({ defaultMessage: "Share profile" })}
        onClose={() => setShareUri(null)}
      />
    </>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: LucideIconType;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <LucideIcon icon={icon} size={16} />
      </View>
      <ThemedText className="text-muted-foreground">{children}</ThemedText>
    </View>
  );
}
