import { formatDistanceToNow } from "date-fns";
import { ca, es, enUS } from "date-fns/locale";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivityIndicator, Alert, Image, View } from "react-native";

import { SummitCard } from "@/components/summit";
import { LucideIcon, Skeleton, ThemedText } from "@/components/ui/atoms";
import { ActionRow, PersonRow } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { UserShareCard } from "@/components/user";
import {
  useAddUserPerson,
  useAnyUserSummits,
  useRemoveUserPerson,
  useUserMe,
  useUserOneGet,
  useUserPeople,
  useUserProfile,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { logError } from "@/lib/log-error";
import { captureAndShare, shareDeeplink } from "@/lib/share";
import { getInitials } from "@/lib/strings";

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
        <View className="mx-6 mb-6 gap-2">
          {!!user.town && <InfoRow icon={House}>{user.town}</InfoRow>}
          <InfoRow icon={Calendar}>
            <FormattedMessage
              defaultMessage="Member since {duration}"
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
                  },
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
                disabled={isSharing || isPendingSummits}
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
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </View>
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </View>
          <View className="mt-4 flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-44" />
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
