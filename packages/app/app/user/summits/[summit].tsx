import { format } from "date-fns/format";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Share as ShareIcon,
  SquarePen,
  Trash2,
} from "lucide-react-native";
import { useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";


import { useAuth } from "@/components/providers/auth-provider";
import { SummitShareCard } from "@/components/summit";
import {
  ActivityIndicator,
  Avatar,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  ImagePreviewModal,
  MountainItemList,
  ScreenHeader,
  SharePulseBadge,
  useImagePreview,
} from "@/components/ui/molecules";
import {
  useDeleteSummitMutation,
  useSummitGet,
} from "@/domains/summit/summit.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import {
  CONFETTI_EXPLOSION_SPEED,
  CONFETTI_FALL_SPEED,
  getConfettiOrigin,
} from "@/lib/confetti";
import { captureAndShare, shareDeeplink } from "@/lib/share";
import { getInitials } from "@/lib/strings";

const Content = () => {
  const intl = useIntl();
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { summit, from } = useLocalSearchParams<{
    summit: string;
    from?: string;
  }>();
  const justCreated = from === "create";

  const { data, isPending } = useSummitGet({ summitId: summit });
  const { data: me } = useUserMe();
  const { mutateAsync: deleteSummit } = useDeleteSummitMutation();

  const { previewImage, isPreviewOpen, openPreview, closePreview } =
    useImagePreview();

  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const isUserParticipant = data?.users.some((user) => user.userId === me?.id);

  const shareTextFallback = async () => {
    if (!data) return;
    await shareDeeplink({
      intl,
      path: `user/summits/${summit}`,
      messages: {
        en: `🏔️ Check out this summit on cims!\n${data.mountainName} 💪`,
        ca: `🏔️ Mira aquest cim a cims!\n${data.mountainName} 💪`,
        es: `🏔️ Mira esta cima en cims!\n${data.mountainName} 💪`,
      },
    });
  };

  const handleShare = async () => {
    if (!data || isSharing) return;
    setIsSharing(true);
    await captureAndShare({
      cardRef: shareCardRef,
      prefetchUrls: [data.summitImageUrl],
      dialogTitle: intl.formatMessage({ defaultMessage: "Share summit" }),
      fallback: shareTextFallback,
      logTag: "summit/share-card",
    });
    setIsSharing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Deleting summit" }),
      intl.formatMessage({
        defaultMessage: "Are you sure you want to continue?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Yes" }),
          style: "default",
          onPress: async () => {
            await deleteSummit({ summitId: summit });
            router.back();
          },
        },
      ],
    );
  };

  if (isPending || !data) {
    return (
      <ThemedView className="flex-1">
        <ScreenHeader />
        {/* Header: mountain name + date */}
        <View className="px-6 pb-2 pt-2">
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="h-6 w-36" />
        </View>
        {/* Summit photo */}
        <Skeleton className="aspect-square w-full" />
        {/* People section */}
        <View className="mt-6 gap-2 px-6">
          <Skeleton className="mb-2 h-8 w-20" />
          <View className="gap-2">
            {[0, 1].map((i) => (
              <View key={i} className="flex-row items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </View>
            ))}
          </View>
        </View>
        {/* Actions section */}
        <View className="mt-6 gap-2 px-6">
          <Skeleton className="mb-2 h-8 w-24" />
          {[0, 1, 2].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </View>
          ))}
        </View>
        {/* Mountain section */}
        <View className="mt-6 gap-2 px-6">
          <Skeleton className="mb-2 h-8 w-28" />
          <View className="flex-row gap-4">
            <Skeleton className="size-[100px] rounded" />
            <View className="flex-1 justify-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </View>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24 pt-2"
      >
        <View className="mb-4 bg-background px-6 pb-2">
          <ThemedText className="text-3xl font-bold">
            {data.mountainName}
          </ThemedText>
          <ThemedText className="text-lg font-semibold text-muted-foreground">
            {format(data.summitedAt, "dd MMM yyyy")}
          </ThemedText>
        </View>
        <Pressable
          className="overflow-hidden rounded"
          disabled={isSharing}
          onPress={() => openPreview({ uri: data.summitImageUrl })}
        >
          <Image
            source={{ uri: data.summitImageUrl }}
            className="aspect-square w-full"
            resizeMode="cover"
          />
        </Pressable>
        <View className="mt-6 gap-2 px-6">
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="People" />
          </ThemedText>
          <View className="gap-2">
            {data.users.map((user) => (
              <Link
                key={user.userId}
                href={{
                  pathname: "/user/[user]",
                  params: { user: user.userId },
                }}
                asChild
              >
                <TouchableOpacity className="flex-row items-center gap-2">
                  <Avatar
                    size="xs"
                    imageUrl={user.imageUrl}
                    initials={getInitials(getFullName(user))}
                  />
                  <ThemedText>{getFullName(user)}</ThemedText>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
        <View className="mt-6 gap-2 px-6">
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Actions" />
          </ThemedText>
          <ActionRow
            onPress={handleShare}
            icon={ShareIcon}
            intent="muted"
            iconOverride={isSharing ? <ActivityIndicator size="sm" /> : undefined}
            trailing={justCreated ? <SharePulseBadge /> : undefined}
          >
            <FormattedMessage defaultMessage="Share" />
          </ActionRow>
          {isUserParticipant && (
            <Link
              href={{
                pathname: "/user/summits/[summit]/edit",
                params: { summit },
              }}
              asChild
            >
              <ActionRow icon={SquarePen} intent="blue">
                <FormattedMessage defaultMessage="Edit summit" />
              </ActionRow>
            </Link>
          )}
          {isUserParticipant && (
            <ActionRow onPress={handleDelete} icon={Trash2} intent="danger">
              <FormattedMessage defaultMessage="Delete summit" />
            </ActionRow>
          )}
        </View>
        <View className="mt-6 gap-2 px-6">
          <ThemedText className="mb-2 text-2xl font-semibold">
            <FormattedMessage defaultMessage="Mountain" />
          </ThemedText>
          <MountainItemList
            slug={data.mountainSlug}
            name={data.mountainName}
            location={data.mountainLocation}
            latitude={data.mountainLatitude ?? undefined}
            longitude={data.mountainLongitude ?? undefined}
            height={data.mountainHeight}
            essential={data.mountainEssential}
            imageUrl={data.mountainImageUrl ?? null}
          />
        </View>
      </ScrollView>
      {/*
        Off-screen render for view-shot capture:
        - collapsable={false} prevents Android from optimizing the view away
        - left: -10000 keeps it out of the user's viewport
        - pointerEvents="none" so the hidden view never steals touches
      */}
      <View
        collapsable={false}
        pointerEvents="none"
        style={{ position: "absolute", left: -10000, top: 0 }}
      >
        <SummitShareCard
          ref={shareCardRef}
          mountainName={data.mountainName}
          mountainHeight={data.mountainHeight}
          mountainEssential={data.mountainEssential}
          summitImageUrl={data.summitImageUrl}
          summitedAt={data.summitedAt}
          users={data.users}
        />
      </View>
      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
      {justCreated && (
        <ConfettiCannon
          count={Math.min(
            300,
            Math.max(
              60,
              80 +
                Math.floor((Number(data.mountainHeight) - 1000) / 20) +
                (data.mountainEssential ? 60 : 0),
            ),
          )}
          origin={getConfettiOrigin(screenW, screenH)}
          fadeOut
          autoStart
          explosionSpeed={CONFETTI_EXPLOSION_SPEED}
          fallSpeed={CONFETTI_FALL_SPEED}
        />
      )}
    </ThemedView>
  );
};

export default function SummitsSummitPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return <Content />;
}
