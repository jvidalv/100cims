import { isToday } from "date-fns/isToday";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, Link, useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Calendar,
  Clock,
  MessagesSquare,
  Settings,
  Share as ShareIcon,
  Trash2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";


import { PlanShareCard } from "@/components/plan";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Avatar,
  EnrichedThemedText,
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  MountainItemList,
  SharePreviewModal,
  SharePulseBadge,
} from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { getMountainPts } from "@/domains/mountain/mountain.util";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { consumePlanCompletionImages } from "@/domains/plan/plan-completion-cache";
import {
  useAdminDeletePlanMutation,
  usePlanJoin,
  usePlanLeave,
  usePlanOne,
} from "@/domains/plan/plan.api";
import { useIsAdmin, useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import {
  CONFETTI_EXPLOSION_SPEED,
  CONFETTI_FALL_SPEED,
  getConfettiOrigin,
} from "@/lib/confetti";
import { formatDayDistance } from "@/lib/dates";
import { captureShareCard, shareDeeplink } from "@/lib/share";
import { getInitials } from "@/lib/strings";

const PlanSummits = ({
  mountains,
}: {
  mountains: {
    id: string;
    name: string;
    height: string;
    slug: string;
    imageUrl: string | null;
    essential: boolean;
    location: string;
  }[];
}) => {
  const totalPoints = mountains.reduce((acc, m) => {
    const height = parseInt(m.height);
    return acc + getMountainPts(height, m.essential);
  }, 0);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Summits" />
        </ThemedText>
        <ThemedText className="text-muted-foreground">
          <FormattedMessage
            defaultMessage="{points} pts"
            values={{ points: totalPoints }}
          />
        </ThemedText>
      </View>
      <View className="gap-2">
        {mountains.map(
          ({ id, name, height, slug, imageUrl, essential, location }) => (
            <MountainItemList
              key={id}
              name={name}
              height={height}
              slug={slug}
              imageUrl={imageUrl}
              essential={essential}
              location={location}
            />
          ),
        )}
      </View>
    </View>
  );
};

export default function PlanIdPage() {
  const router = useRouter();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { data } = usePlanOne({ id });
  const { isAuthenticated } = useAuth();
  const { data: chatsUnread } = usePlanChatUnread();
  const hasUnreadMessages = chatsUnread?.includes(id);
  const { data: user } = useUserMe();
  const isAdmin = useIsAdmin();
  const { mutateAsync: joinPlan, isPending: isLoadingJoinPlan } =
    usePlanJoin(id);
  const { mutateAsync: leavePlan, isPending: isLoadingLeavePLan } =
    usePlanLeave(id);
  const { mutateAsync: adminDeletePlan } = useAdminDeletePlanMutation();
  const intl = useIntl();

  const plan = data;
  const justCompleted = from === "complete";
  const [completionImages, setCompletionImages] = useState<
    Record<string, string>
  >({});
  useEffect(() => {
    if (justCompleted) {
      setCompletionImages(consumePlanCompletionImages(id));
    }
  }, [id, justCompleted]);
  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUri, setShareUri] = useState<string | null>(null);
  const isCreator = user?.id === plan?.creatorId;
  const hasJoined = plan?.users.some((u) => u.id === user?.id);

  const mountainsWithImages = plan?.mountains?.filter((m) => m.imageUrl);
  const when = plan?.startDate
    ? formatDayDistance(new Date(plan.startDate))
    : intl.formatMessage({ defaultMessage: "Date not decided" });

  const isOpen = plan?.status === "open";
  const isOngoing =
    isOpen && plan?.startDate && isToday(new Date(plan.startDate));
  const isCompleted = plan?.status === "completed";
  const isCanceled = plan?.status === "canceled";

  const shareTextFallback = async () => {
    if (!plan) return;
    await shareDeeplink({
      intl,
      path: `plan/${id}`,
      messages: {
        en: `📍 Hiking plan on cims!\n${plan.title} 💪`,
        ca: `📍 Pla de senderisme a cims!\n${plan.title} 💪`,
        es: `📍 Plan de senderismo en cims!\n${plan.title} 💪`,
      },
    });
  };

  const onShare = async () => {
    if (!plan || isSharing) return;
    if (!isCompleted) {
      await shareTextFallback();
      return;
    }
    setIsSharing(true);
    const uri = await captureShareCard({
      cardRef: shareCardRef,
      prefetchUrls: plan.mountains.slice(0, 4).map((m) => m.imageUrl),
      logTag: "plan/share-card",
    });
    setIsSharing(false);
    if (uri) {
      setShareUri(uri);
    } else {
      await shareTextFallback();
    }
  };

  const handleJoin = () => {
    if (!isAuthenticated) {
      return router.push("/join");
    }

    void joinPlan();
  };

  const handleLeave = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Leave plan?" }),
      intl.formatMessage({
        defaultMessage: "Are you sure you want to leave this plan?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Leave" }),
          style: "destructive",
          onPress: () => {
            void leavePlan();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleAdminDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete as admin" }),
      intl.formatMessage({
        defaultMessage: "This removes the plan for everyone. Continue?",
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
            await adminDeletePlan({ planId: id });
            router.back();
          },
        },
      ],
    );
  };

  if (!plan)
    return (
      <ThemedView className="flex-1">
        <Skeleton className="h-[300px] w-full rounded-none" />
        <View className="gap-8 px-6 py-6">
          <View className="gap-4">
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-24" />
              </View>
              <View className="flex-row items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-32" />
              </View>
            </View>
            <View className="gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </View>
          </View>
          <View className="gap-4">
            <Skeleton className="h-7 w-32" />
            <View className="flex-row items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </View>
            <View className="flex-row items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </View>
          </View>
          <View className="gap-4">
            <Skeleton className="h-7 w-24" />
            {[0, 1, 2].map((i) => (
              <View key={i} className="flex-row gap-4">
                <Skeleton className="size-[100px] rounded" />
                <View className="flex-1 justify-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ThemedView>
    );

  const sharePayload = {
    title: plan.title,
    totalHeight: plan.mountains.reduce(
      (acc, m) => acc + (parseInt(m.height) || 0),
      0,
    ),
    summitCount: plan.mountains.length,
    date:
      plan.startDate ??
      (typeof plan.updatedAt === "string" || typeof plan.updatedAt === "number"
        ? new Date(plan.updatedAt).toISOString()
        : new Date().toISOString()),
    images: plan.mountains.slice(0, 4).map((m) =>
      completionImages[m.id]
        ? `data:image/jpeg;base64,${completionImages[m.id]}`
        : (m.imageUrl ?? null),
    ),
    users: plan.users.map((u) => ({
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      imageUrl: u.imageUrl,
    })),
  };

  const confettiCount = Math.min(
    320,
    Math.max(
      80,
      100 +
        plan.mountains.length * 20 +
        (plan.mountains.some((m) => m.essential) ? 60 : 0),
    ),
  );

  return (
    <>
    <ParallaxScrollView
      title={plan.title}
      height={mountainsWithImages?.length ? undefined : 160}
      headerClassName="flex items-center justify-center bg-primary"
      parallaxHeaderTitleClassName="text-3xl"
      contentClassName="gap-8 px-6 py-6"
      headerImage={
        mountainsWithImages?.length ? (
          <View
            className="relative flex size-full flex-row overflow-hidden"
            style={{ flex: 1 }}
          >
            {mountainsWithImages.slice(0, 4).map(({ imageUrl }, i, arr) => {
              const count = arr.length;
              if (count === 1) {
                return (
                  <Image
                    key={imageUrl}
                    source={{ uri: imageUrl!, cache: "force-cache" }}
                    className="absolute bg-neutral-300 dark:bg-neutral-800"
                    style={{ width: "100%", height: "100%" }}
                  />
                );
              }
              if (count === 2) {
                return (
                  <Image
                    key={imageUrl}
                    source={{ uri: imageUrl!, cache: "force-cache" }}
                    className="bg-neutral-300 dark:bg-neutral-800"
                    style={{ width: "50%", height: "100%" }}
                  />
                );
              }
              const hasOnlyThree = arr.length === 3;
              const isLast = i === arr.length - 1;
              const half = "50%";
              const positionStyle =
                i === 0
                  ? { top: 0, left: 0 }
                  : i === 1
                    ? { top: 0, right: 0 }
                    : i === 2
                      ? { bottom: 0, left: 0 }
                      : { bottom: 0, right: 0 };

              return (
                <Image
                  key={imageUrl}
                  source={{ uri: imageUrl!, cache: "force-cache" }}
                  className="absolute bg-neutral-300 dark:bg-neutral-800"
                  style={{
                    width: hasOnlyThree && isLast ? "100%" : half,
                    height: half,
                    ...positionStyle,
                  }}
                />
              );
            })}
            <View className="absolute bottom-0 size-full">
              <LinearGradient
                colors={[
                  "transparent",
                  "transparent",
                  "transparent",
                  "rgba(0,0,0,0.4)",
                ]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        ) : (
          <View
            className="size-full flex-1 items-center justify-center bg-neutral-300 dark:bg-neutral-800"
            style={{ backgroundColor: "#ffd097" }}
          />
        )
      }
    >
      <View>
        <View className="mb-4 flex flex-row gap-4">
          {isOpen && !isOngoing && (
            <View className="flex flex-row items-center gap-2">
              <View className="size-4 rounded bg-blue-500" />
              <ThemedText className="text-lg font-medium text-blue-500">
                <FormattedMessage defaultMessage="Open" />
              </ThemedText>
            </View>
          )}
          {isOpen && isOngoing && (
            <View className="flex flex-row items-center gap-2">
              <View className="size-4 rounded bg-purple-500" />
              <ThemedText className="text-lg font-medium text-purple-500">
                <FormattedMessage defaultMessage="Ongoing" />
              </ThemedText>
            </View>
          )}
          {isCompleted && (
            <View className="flex flex-row items-center gap-2">
              <View className="size-4 rounded bg-emerald-500" />
              <ThemedText className="text-lg font-medium text-emerald-500">
                <FormattedMessage defaultMessage="Completed" />
              </ThemedText>
            </View>
          )}
          {isCanceled && (
            <View className="flex flex-row items-center gap-2">
              <View className="size-4 rounded bg-neutral-500" />
              <ThemedText className="text-lg font-medium text-neutral-500">
                <FormattedMessage defaultMessage="Canceled" />
              </ThemedText>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={Clock} size={20} />
            <ThemedText className="text-lg font-medium">{when}</ThemedText>
          </View>
        </View>
        <View>
          {plan.description ? (
            <EnrichedThemedText className="text-muted-foreground">
              {plan.description}
            </EnrichedThemedText>
          ) : (
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="No extra information added." />
            </ThemedText>
          )}
        </View>
      </View>
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Participants" />
        </ThemedText>
        <View className="gap-2">
          {plan.users.map((user) => (
            <Link
              key={user.id}
              href={{ pathname: "/user/[user]", params: { user: user.id } }}
              asChild
            >
              <TouchableOpacity className="flex-row items-center gap-2">
                <Avatar
                  size="xs"
                  initials={getInitials(getFullName(user))}
                  imageUrl={user.imageUrl}
                />
                <ThemedText>{getFullName(user)}</ThemedText>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>
      <View className="gap-2">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Actions" />
        </ThemedText>
        {isOpen && !hasJoined && (
          <ActionRow
            onPress={handleJoin}
            icon={ArrowUp}
            intent="primary"
            disabled={isLoadingJoinPlan}
            iconOverride={
              isLoadingJoinPlan ? <ActivityIndicator size="sm" /> : undefined
            }
          >
            <FormattedMessage defaultMessage="Join plan" />
          </ActionRow>
        )}
        {isOpen && isCreator && !!plan.startDate && (
          <Link
            href={{ pathname: "/plan/[id]/complete", params: { id } }}
            asChild
          >
            <ActionRow icon={BadgeCheck} intent="emerald">
              <FormattedMessage defaultMessage="Complete plan" />
            </ActionRow>
          </Link>
        )}
        {isOpen && isCreator && !plan.startDate && (
          <Link
            href={{ pathname: "/plan/[id]/edit", params: { id } }}
            asChild
          >
            <ActionRow icon={Calendar} intent="primary">
              <FormattedMessage defaultMessage="Set plan date" />
            </ActionRow>
          </Link>
        )}
        {isCreator && (
          <Link
            href={{ pathname: "/plan/[id]/edit", params: { id } }}
            asChild
          >
            <ActionRow icon={Settings} intent="muted">
              <FormattedMessage defaultMessage="Modify plan" />
            </ActionRow>
          </Link>
        )}
        <ActionRow
          onPress={onShare}
          icon={ShareIcon}
          intent="muted"
          iconOverride={
            isSharing ? <ActivityIndicator size="sm" /> : undefined
          }
          trailing={justCompleted ? <SharePulseBadge /> : undefined}
        >
          <FormattedMessage defaultMessage="Share" />
        </ActionRow>
        {hasJoined && (
          <Link
            href={{ pathname: "/plan/[id]/chat", params: { id } }}
            asChild
          >
            <ActionRow
              icon={MessagesSquare}
              iconSize={20}
              intent="blue"
              badge={hasUnreadMessages}
            >
              <FormattedMessage defaultMessage="Chat with others" />
            </ActionRow>
          </Link>
        )}
        {hasJoined && !isCreator && (
          <ActionRow
            onPress={() => handleLeave()}
            icon={ArrowDown}
            intent="danger"
            iconOverride={
              isLoadingLeavePLan ? (
                <ActivityIndicator size="sm" color="#ef4444" />
              ) : undefined
            }
            className="opacity-80"
          >
            <FormattedMessage defaultMessage="Leave" />
          </ActionRow>
        )}
        {isAdmin && (
          <ActionRow
            onPress={handleAdminDelete}
            icon={Trash2}
            intent="danger"
          >
            <FormattedMessage defaultMessage="Delete (admin)" />
          </ActionRow>
        )}
      </View>
      {!!plan.mountains?.length && <PlanSummits mountains={plan.mountains} />}
    </ParallaxScrollView>
      {isCompleted && (
        <View
          collapsable={false}
          pointerEvents="none"
          style={{ position: "absolute", left: -10000, top: 0 }}
        >
          <PlanShareCard ref={shareCardRef} {...sharePayload} />
        </View>
      )}
      <SharePreviewModal
        visible={!!shareUri}
        imageUri={shareUri}
        dialogTitle={intl.formatMessage({ defaultMessage: "Share plan" })}
        onClose={() => setShareUri(null)}
      />
      {justCompleted && (
        <ConfettiCannon
          count={confettiCount}
          origin={getConfettiOrigin(screenW, screenH)}
          fadeOut
          autoStart
          explosionSpeed={CONFETTI_EXPLOSION_SPEED}
          fallSpeed={CONFETTI_FALL_SPEED}
        />
      )}
    </>
  );
}
