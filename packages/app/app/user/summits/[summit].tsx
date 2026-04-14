import { format } from "date-fns/format";
import * as Haptics from "expo-haptics";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Avatar,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  ImagePreviewModal,
  ScreenHeader,
  useImagePreview,
} from "@/components/ui/molecules";
import {
  useDeleteSummitMutation,
  useSummitGet,
  useSummitReactions,
  useSummitReactionMutation,
} from "@/domains/summit/summit.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getUrlDeeplink } from "@/lib/deeplink";
import { getInitials } from "@/lib/strings";

const REACTION_EMOJIS = ["❤️", "👍🏽", "💪🏽", "🐶", "🧨"] as const;

const Content = () => {
  const intl = useIntl();
  const router = useRouter();
  const { summit } = useLocalSearchParams<{ summit: string }>();

  const { data, isPending } = useSummitGet({ summitId: summit });
  const { data: me } = useUserMe();
  const { mutateAsync: deleteSummit } = useDeleteSummitMutation();
  const { data: reactionsData } = useSummitReactions({ summitId: summit });
  const { mutate: toggleReaction } = useSummitReactionMutation();

  const { previewImage, isPreviewOpen, openPreview, closePreview } =
    useImagePreview();

  const isUserParticipant = data?.users.some((user) => user.userId === me?.id);

  const handleShare = async () => {
    if (!data) return;
    const messages = {
      en: `🏔️ Check out this summit on cims!\n${data.mountainName} 💪\n\n${getUrlDeeplink(`user/summits/${summit}`)}`,
      ca: `🏔️ Mira aquest cim a cims!\n${data.mountainName} 💪\n\n${getUrlDeeplink(`user/summits/${summit}`)}`,
      es: `🏔️ Mira esta cima en cims!\n${data.mountainName} 💪\n\n${getUrlDeeplink(`user/summits/${summit}`)}`,
    };
    const locale = intl.locale;
    const msg = messages[locale as "ca" | "es" | "en"] || messages.en;
    await Share.share({ message: msg });
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
        <View className="px-6">
          <View className="flex-row justify-between">
            <View>
              <Skeleton className="mb-1 h-9 w-64" />
              <Skeleton className="mb-8 h-6 w-20" />
            </View>
            <Skeleton className="size-16 rounded" />
          </View>
          <Skeleton className="mb-6 size-10 rounded-full" />
        </View>
        <Skeleton className="size-full min-h-[500px]" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12 pt-2"
      >
        <Link
          href={{
            pathname: "/mountain/[slug]",
            params: { slug: data.mountainSlug },
          }}
          asChild
        >
          <TouchableOpacity className="mb-4 flex-row justify-between bg-background gap-4 px-6 pb-2">
            <View className="flex-1">
              <ThemedText className="text-3xl font-bold">
                {data.mountainName}
              </ThemedText>
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-lg font-semibold text-muted-foreground">
                  {format(data.summitedAt, "dd MMM yyyy")}
                </ThemedText>
              </View>
            </View>
            {data.mountainImageUrl ? (
              <Image
                className="size-16 rounded"
                source={{ uri: data.mountainImageUrl }}
              />
            ) : (
              <View className="rounded bg-neutral-500" />
            )}
          </TouchableOpacity>
        </Link>
        <Pressable
          className="overflow-hidden rounded"
          onPress={() => openPreview({ uri: data.summitImageUrl })}
        >
          <Image
            source={{ uri: data.summitImageUrl }}
            className="aspect-square w-full"
            resizeMode="cover"
          />
        </Pressable>
        <View className="flex-row justify-center gap-2 px-6 py-4">
          {REACTION_EMOJIS.map((emoji) => {
            const reactionCount =
              reactionsData?.reactions.find((r) => r.emoji === emoji)?.count ??
              0;
            const hasUserReacted = reactionsData?.userReactions.includes(emoji);

            return (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleReaction({ summitId: summit, emoji });
                }}
                className={`flex-row items-center gap-1 rounded-full border px-3 py-1.5 ${
                  hasUserReacted
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                } ${reactionCount === 0 ? "opacity-50" : ""}`}
              >
                <ThemedText className="text-lg">{emoji}</ThemedText>
                {reactionCount > 0 && (
                  <ThemedText
                    className={`text-lg font-bold ${
                      hasUserReacted ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {reactionCount}
                  </ThemedText>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
            iconName="square.and.arrow.up"
            intent="muted"
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
              <ActionRow iconName="square.and.pencil" intent="blue">
                <FormattedMessage defaultMessage="Edit summit" />
              </ActionRow>
            </Link>
          )}
          {isUserParticipant && (
            <ActionRow onPress={handleDelete} iconName="trash" intent="danger">
              <FormattedMessage defaultMessage="Delete summit" />
            </ActionRow>
          )}
        </View>
      </ScrollView>
      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
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
