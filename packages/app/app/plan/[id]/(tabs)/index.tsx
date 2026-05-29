import { format } from "date-fns/format";
import { isToday } from "date-fns/isToday";
import * as Linking from "expo-linking";
import { useGlobalSearchParams, Link, useRouter } from "expo-router";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Ban,
  BellOff,
  Bike,
  Calendar,
  ChevronRight,
  CircleDot,
  Clock,
  Footprints,
  Lock,
  Share as ShareIcon,
  SportShoe,
  Trash2,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
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
  FeaturedStar,
  LucideIcon,
  Skeleton,
  StravaIcon,
  ThemedText,
  ThemedView,
  WhatsAppIcon,
  WikilocIcon,
} from "@/components/ui/atoms";
import {
  ActionRow,
  MountainItemList,
  PushPermissionDialog,
  SharePreviewModal,
  SharePulseBadge,
} from "@/components/ui/molecules";
import { PlanCoverBackground } from "@/components/ui/molecules/plan-cover-background";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { getMountainPts } from "@/domains/mountain/mountain.util";
import { consumePlanCompletionImages } from "@/domains/plan/plan-completion-cache";
import {
  useAdminDeletePlanMutation,
  usePlanJoin,
  usePlanLeave,
  usePlanOne,
} from "@/domains/plan/plan.api";
import { useIsAdmin, useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useAskPushPermission } from "@/hooks/use-ask-push-permission";
import { usePushPermissionStatus } from "@/hooks/use-push-permission-status";
import {
  CONFETTI_COLORS,
  CONFETTI_EXPLOSION_SPEED,
  CONFETTI_FALL_SPEED,
  getConfettiOrigin,
} from "@/lib/confetti";
import { formatDayDistance, parseLocalDateString } from "@/lib/dates";
import { getDateFnsLocale, getLocale } from "@/lib/locale";
import { captureShareCard, shareDeeplink } from "@/lib/share";
import { getInitials } from "@/lib/strings";

const PLAN_TYPE_META: Record<
  "hike" | "trail" | "bike",
  { icon: typeof Bike; label: React.ReactNode }
> = {
  hike: {
    icon: Footprints,
    label: <FormattedMessage defaultMessage="Hike" />,
  },
  trail: {
    icon: SportShoe,
    label: <FormattedMessage defaultMessage="Trail" />,
  },
  bike: { icon: Bike, label: <FormattedMessage defaultMessage="Bike" /> },
};

/**
 * Tappable row in the plan-detail header for an external link (WhatsApp,
 * Wikiloc, Strava). `onBeforeOpen` gates the open — return `false` to abort
 * (e.g. WhatsApp uses it to fire a "join first" alert for non-members).
 */
const PlanLinkRow = ({
  icon,
  label,
  url,
  onBeforeOpen,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  url: string;
  onBeforeOpen?: () => boolean;
}) => (
  <TouchableOpacity
    className="flex-row items-center gap-2"
    hitSlop={8}
    onPress={() => {
      if (onBeforeOpen && !onBeforeOpen()) return;
      void Linking.openURL(url);
    }}
  >
    {icon}
    <ThemedText className="text-lg font-medium">{label}</ThemedText>
  </TouchableOpacity>
);

const PlanTypeBadge = ({
  type,
}: {
  type: "hike" | "trail" | "bike";
}) => {
  const meta = PLAN_TYPE_META[type];
  return (
    <View className="flex flex-row items-center gap-2">
      <LucideIcon icon={meta.icon} size={20} primary />
      <ThemedText className="text-lg font-medium text-primary">
        {meta.label}
      </ThemedText>
    </View>
  );
};

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

  // useGlobalSearchParams (not useLocal-) — inside a NativeTabs eagerly-mounted
  // child of [id], useLocalSearchParams doesn't bind the parent dynamic.
  const { id, from } = useGlobalSearchParams<{ id: string; from?: string }>();
  const { data } = usePlanOne({ id });
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const isAdmin = useIsAdmin();
  const { mutateAsync: joinPlan, isPending: isLoadingJoinPlan } =
    usePlanJoin(id);
  const { mutateAsync: leavePlan, isPending: isLoadingLeavePLan } =
    usePlanLeave(id);
  const { mutateAsync: adminDeletePlan } = useAdminDeletePlanMutation();
  const intl = useIntl();

  const {
    isOpen: isPushPromptOpen,
    ask: askPushPermission,
    dismiss: dismissPushPrompt,
    confirm: confirmPushPrompt,
  } = useAskPushPermission();

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
  // Push-permission status: the "you won't get notifications" banner only
  // shows when the user has actively joined the plan AND has denied the OS
  // permission. `undetermined` is silent (the pre-permission CTA elsewhere
  // handles that case); we only nag once the user said no.
  const pushStatus = usePushPermissionStatus();
  const showPushDeniedBanner = hasJoined && pushStatus === "denied";

  const mountainsWithImages = plan?.mountains?.filter((m) => m.imageUrl);
  const when = plan?.startDate
    ? formatDayDistance(parseLocalDateString(plan.startDate))
    : intl.formatMessage({ defaultMessage: "Date not decided" });
  const whenAbsolute = plan?.startDate
    ? format(
        parseLocalDateString(plan.startDate),
        getLocale() === "en" ? "d MMMM yyyy" : "d 'de' MMMM yyyy",
        { locale: getDateFnsLocale() },
      )
    : null;

  const isOpen = plan?.status === "open";
  const isOngoing =
    isOpen &&
    !!plan?.startDate &&
    isToday(parseLocalDateString(plan.startDate));
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

  const handleJoin = async () => {
    if (!isAuthenticated) {
      return router.push("/join");
    }

    try {
      await joinPlan();
      // High-intent moment — skip the 7-day dismiss cooldown.
      void askPushPermission({ bypassCooldown: true });
    } catch {
      // Mutation errors surface via react-query state; the bypass CTA simply
      // doesn't fire on failure, which is the right call.
    }
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
      height={plan.imageUrl || mountainsWithImages?.length ? undefined : 160}
      headerClassName="flex items-center justify-center bg-primary"
      parallaxHeaderTitleClassName="text-3xl"
      contentClassName="gap-8 px-6 pt-6 pb-32"
      headerImage={
        <PlanCoverBackground
          customImageUrl={plan.imageUrl}
          mountains={mountainsWithImages}
          title={plan.title}
        />
      }
    >
      <View>
        <View className="mb-4 gap-3">
          <View className="flex flex-row flex-wrap items-center gap-4">
            {isOpen && !isOngoing && (
              <View className="flex flex-row items-center gap-2">
                <LucideIcon icon={CircleDot} size={20} color="#3b82f6" />
                <ThemedText className="text-lg font-medium text-blue-500">
                  <FormattedMessage defaultMessage="Open" />
                </ThemedText>
              </View>
            )}
            {isOpen && isOngoing && (
              <View className="flex flex-row items-center gap-2">
                <LucideIcon icon={Activity} size={20} color="#a855f7" />
                <ThemedText className="text-lg font-medium text-purple-500">
                  <FormattedMessage defaultMessage="Ongoing" />
                </ThemedText>
              </View>
            )}
            {isCompleted && (
              <View className="flex flex-row items-center gap-2">
                <LucideIcon icon={BadgeCheck} size={20} color="#10b981" />
                <ThemedText className="text-lg font-medium text-emerald-500">
                  <FormattedMessage defaultMessage="Completed" />
                </ThemedText>
              </View>
            )}
            {isCanceled && (
              <View className="flex flex-row items-center gap-2">
                <LucideIcon icon={Ban} size={20} color="#737373" />
                <ThemedText className="text-lg font-medium text-neutral-500">
                  <FormattedMessage defaultMessage="Canceled" />
                </ThemedText>
              </View>
            )}
            {(plan.type === "hike" ||
              plan.type === "trail" ||
              plan.type === "bike") && <PlanTypeBadge type={plan.type} />}
            {plan.isPrivate && (
              <View className="flex flex-row items-center gap-2">
                <LucideIcon icon={Lock} size={20} primary />
                <ThemedText className="text-lg font-medium text-primary">
                  <FormattedMessage defaultMessage="Private" />
                </ThemedText>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={Calendar} size={20} />
            {whenAbsolute ? (
              <>
                <ThemedText className="text-lg font-medium">
                  {whenAbsolute}
                </ThemedText>
                <ThemedText className="text-lg text-muted-foreground">
                  {when}
                </ThemedText>
              </>
            ) : (
              <ThemedText className="text-lg font-medium">{when}</ThemedText>
            )}
          </View>
          {plan.startDate && plan.startTime && (
            <View className="flex-row items-center gap-2">
              <LucideIcon icon={Clock} size={20} />
              <ThemedText className="text-lg font-medium">
                <FormattedMessage
                  defaultMessage="Meeting time {time}"
                  values={{ time: plan.startTime }}
                />
              </ThemedText>
            </View>
          )}
          {plan.featured && (
            <View className="flex-row items-center gap-2">
              <FeaturedStar size={20} />
              <ThemedText className="text-lg font-medium text-amber-500">
                <FormattedMessage defaultMessage="Featured" />
              </ThemedText>
            </View>
          )}
          {plan.whatsappGroupUrl && (
            <PlanLinkRow
              icon={<WhatsAppIcon size={20} />}
              label={<FormattedMessage defaultMessage="WhatsApp group" />}
              url={plan.whatsappGroupUrl}
              onBeforeOpen={() => {
                if (hasJoined) return true;
                Alert.alert(
                  intl.formatMessage({
                    defaultMessage: "Join this plan first",
                  }),
                  intl.formatMessage({
                    defaultMessage:
                      "Once you join, you'll be able to open the WhatsApp group.",
                  }),
                );
                return false;
              }}
            />
          )}
          {plan.wikilocUrl && (
            <PlanLinkRow
              icon={<WikilocIcon size={20} />}
              label={<FormattedMessage defaultMessage="Wikiloc trail" />}
              url={plan.wikilocUrl}
            />
          )}
          {plan.stravaUrl && (
            <PlanLinkRow
              icon={<StravaIcon size={20} />}
              label={<FormattedMessage defaultMessage="Strava" />}
              url={plan.stravaUrl}
            />
          )}
        </View>
        {plan.description ? (
          <View>
            <EnrichedThemedText className="text-muted-foreground">
              {plan.description}
            </EnrichedThemedText>
          </View>
        ) : null}
      </View>
      {plan.organization && (
        <View className="gap-4">
          <ThemedText className="text-2xl font-semibold">
            <FormattedMessage defaultMessage="Hosted by" />
          </ThemedText>
          <Link
            href={{
              pathname: "/organization/[id]",
              params: { id: plan.organization.id },
            }}
            asChild
          >
            <TouchableOpacity className="flex-row items-center gap-2">
              <Avatar
                size="xs"
                initials={getInitials(plan.organization.name)}
                imageUrl={plan.organization.imageUrl}
              />
              <ThemedText className="flex-1" numberOfLines={1}>
                {plan.organization.name}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      )}
      <View className="gap-4">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Participants" />
        </ThemedText>
        <View className="gap-2">
          {/* Server returns organizers first then joinedAt DESC — see
              `planParticipantsOrderBy` shared helper. No client resort. */}
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
                {/* `flex-1 shrink` keeps long names from pushing the
                    Organizer badge off the row — without it, ml-auto on
                    the badge does nothing because the name View has
                    already taken the full width. */}
                <ThemedText className="flex-1 shrink" numberOfLines={1}>
                  {getFullName(user)}
                </ThemedText>
                {user.role === "organizer" && (
                  <View className="rounded-full bg-blue-500/10 px-2 py-0.5">
                    <ThemedText className="text-xs font-medium text-blue-500">
                      <FormattedMessage defaultMessage="Organizer" />
                    </ThemedText>
                  </View>
                )}
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
        {/* "Set plan date" stays as a contextual prompt — it's a CTA, not
            duplicate navigation. Complete / Modify / Chat moved to the
            bottom tab bar and the in-content rows were removed. */}
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
        {showPushDeniedBanner && (
          <ActionRow
            icon={BellOff}
            intent="gold"
            onPress={() => {
              void Linking.openSettings();
            }}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: "Enable notifications in Settings",
            })}
            trailing={
              <View className="ml-auto">
                <LucideIcon icon={ChevronRight} size={20} muted />
              </View>
            }
          >
            <FormattedMessage defaultMessage="Notifications are off" />
          </ActionRow>
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
      <PushPermissionDialog
        isOpen={isPushPromptOpen}
        onClose={dismissPushPrompt}
        onEnable={confirmPushPrompt}
      />
      {justCompleted && (
        <ConfettiCannon
          count={confettiCount}
          origin={getConfettiOrigin(screenW, screenH)}
          fadeOut
          autoStart
          colors={CONFETTI_COLORS}
          explosionSpeed={CONFETTI_EXPLOSION_SPEED}
          fallSpeed={CONFETTI_FALL_SPEED}
        />
      )}
    </>
  );
}
