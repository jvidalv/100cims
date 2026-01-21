import { format } from "date-fns/format";
import * as Haptics from "expo-haptics";
import { Link, Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, Image, View, Pressable } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Avatar,
  Button,
  Icon,
  Skeleton,
  ThemedDateInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BottomDrawer,
  ScreenHeader,
  ImagePreviewModal,
  useImagePreview,
} from "@/components/ui/molecules";
import { useBottomDrawer } from "@/components/ui/molecules/bottom-drawer";
import {
  useDeleteSummitMutation,
  useSummitGet,
  useSummitReactions,
  useSummitReactionMutation,
  useUpdateSummitMutation,
} from "@/domains/summit/summit.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

const REACTION_EMOJIS = ["❤️", "👍🏽", "💪🏽", "🐶", "🧨"] as const;

const Content = () => {
  const intl = useIntl();
  const router = useRouter();
  const { summit } = useLocalSearchParams<{ summit: string }>();

  const { data, isPending } = useSummitGet({ summitId: summit });
  const { data: me } = useUserMe();
  const { mutateAsync: deleteSummit } = useDeleteSummitMutation();
  const { mutateAsync: updateSummit } = useUpdateSummitMutation();
  const { data: reactionsData } = useSummitReactions({ summitId: summit });
  const { mutate: toggleReaction } = useSummitReactionMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useBottomDrawer();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { previewImage, isPreviewOpen, openPreview, closePreview } = useImagePreview();

  const isUserParticipant = data?.users.some((user) => user.userId === me?.id);

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

  const handleUpdate = async () => {
    if (!selectedDate) return;
    await updateSummit({
      summitId: summit,
      summitedAt: selectedDate.toISOString(),
    });
    setIsDrawerOpen(false);
    router.back();
  };

  if (isPending || !data) {
    return (
      <ThemedView className="flex-1">
        <ScreenHeader
          rightElement={
            isUserParticipant ? (
              <View className="flex-row items-center gap-4 pr-4">
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(new Date(data?.summitedAt || Date.now()));
                    setIsDrawerOpen(true);
                  }}
                >
                  <Icon name="gearshape" size={20} muted />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Icon name="trash" size={20} muted />
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
        <View className="px-6">
          <View className="flex-row justify-between">
            <View>
              <Skeleton className="mb-1 h-9 w-64" />
              <Skeleton className="mb-8 h-6 w-20" />
            </View>
            <Skeleton className="size-16 rounded-lg" />
          </View>
          <Skeleton className="mb-6 size-10 rounded-full" />
        </View>
        <Skeleton className="size-full min-h-[500px]" />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader
        rightElement={
          isUserParticipant ? (
            <View className="flex-row items-center gap-4 pr-4">
              <TouchableOpacity
                onPress={() => {
                  setSelectedDate(new Date(data.summitedAt));
                  setIsDrawerOpen(true);
                }}
              >
                <Icon name="gearshape" size={20} muted />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Icon name="trash" size={20} muted />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />
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
                className="size-16 rounded-lg"
                source={{ uri: data.mountainImageUrl }}
              />
            ) : (
              <View className="rounded-lg bg-neutral-500" />
            )}
          </TouchableOpacity>
        </Link>
        <View className="px-6">
          <View className="mb-6 gap-3">
            {data.users.map((user) => (
              <Link
                href={{
                  pathname: "/user/[user]",
                  params: { user: user.userId },
                }}
                key={user.userId}
                asChild
              >
                <TouchableOpacity className="flex-row items-center gap-3">
                  <Avatar
                    size="sm"
                    imageUrl={user.imageUrl}
                    initials={getInitials(getFullName(user))}
                  />
                  <ThemedText className="text-lg">
                    {getFullName(user)}
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
        <Pressable
          className="overflow-hidden rounded-lg"
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
              reactionsData?.reactions.find((r) => r.emoji === emoji)?.count ?? 0;
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
        <TouchableOpacity
          onPress={router.back}
          className="flex-row items-center justify-center gap-2 p-4"
        >
          <Icon name="arrow.left" size={18} muted />
          <ThemedText className="text-lg text-muted-foreground">
            <FormattedMessage defaultMessage="Back" />
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
      <BottomDrawer
        isOpen={isDrawerOpen}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View className="p-6">
          <ThemedText className="mb-4 text-xl font-semibold">
            <FormattedMessage defaultMessage="Update summit date" />
          </ThemedText>
          <ThemedDateInput
            value={selectedDate}
            onDateValid={setSelectedDate}
            noFutureDates
          />
          <Button className="mt-4" onPress={handleUpdate}>
            <FormattedMessage defaultMessage="Save" />
          </Button>
        </View>
      </BottomDrawer>
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
