import { isToday } from "date-fns/isToday";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, Link, useRouter } from "expo-router";
import { analytics } from "expofast-analytics";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Avatar,
  Button,
  EnrichedThemedText,
  Icon,
  Skeleton,
  ThemedText,
} from "@/components/ui/atoms";
import { MountainItemList } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { getMountainPts } from "@/domains/mountain/mountain.util";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { usePlanJoin, usePlanLeave, usePlanOne } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { formatDayDistance } from "@/lib/dates";
import { getUrlDeeplink } from "@/lib/deeplink";
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

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePlanOne({ id });
  const { isAuthenticated } = useAuth();
  const { data: chatsUnread } = usePlanChatUnread();
  const hasUnreadMessages = chatsUnread?.data?.message?.includes(id);
  const { data: user } = useUserMe();
  const { mutateAsync: joinPlan, isPending: isLoadingJoinPlan } =
    usePlanJoin(id);
  const { mutateAsync: leavePlan, isPending: isLoadingLeavePLan } =
    usePlanLeave(id);
  const intl = useIntl();

  const plan = data?.data?.message;
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

  const onShare = async () => {
    analytics.action(`plan-shared-started`, { id: plan?.id });
    const messages = {
      en: `📍 Hiking plan on 100cims!\n${plan?.title} 💪\n\n${getUrlDeeplink(`plan/${id}`)}`,
      ca: `📍 Pla de senderisme a 100cims!\n${plan?.title} 💪\n\n${getUrlDeeplink(`plan/${id}`)}`,
      es: `📍 Plan de senderismo en 100cims!\n${plan?.title} 💪\n\n${getUrlDeeplink(`plan/${id}`)}`,
    };

    const locale = intl.locale;
    const msg = messages[locale as "ca" | "es" | "en"] || messages.en;

    const response = await Share.share({
      message: msg,
    });

    if (response.action === "sharedAction")
      analytics.action(`plan-shared-done`, { id: plan?.id });

    if (response.action === "dismissedAction")
      analytics.action(`plan-shared-canceled`, { id: plan?.id });
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

  if (!plan)
    return (
      <View>
        <Skeleton className="mb-6 h-[300px] w-full" />
        <View className="gap-4 px-6">
          <View className="flex-row gap-4">
            <View className="flex-row items-center gap-2">
              <Skeleton className="size-6" />
              <Skeleton className="h-6 w-20" />
            </View>
            <View className="flex-row items-center gap-2">
              <Skeleton className="size-6" />
              <Skeleton className="h-6 w-36" />
            </View>
          </View>
          <Skeleton className="h-6 w-full" />
        </View>
      </View>
    );

  return (
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
                    className="absolute bg-gray-300 dark:bg-gray-800"
                    style={{ width: "100%", height: "100%" }}
                  />
                );
              }
              if (count === 2) {
                return (
                  <Image
                    key={imageUrl}
                    source={{ uri: imageUrl!, cache: "force-cache" }}
                    className="bg-gray-300 dark:bg-gray-800"
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
                  className="absolute bg-gray-300 dark:bg-gray-800"
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
            className="size-full flex-1 items-center justify-center bg-gray-300 dark:bg-gray-800"
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
            <Icon name="clock" size={20} />
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
        <View className="gap-3">
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

          <View>
            {isOpen && (
              <TouchableOpacity
                onPress={onShare}
                className="mt-2 flex-row items-center gap-2"
              >
                <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <Icon name="square.and.arrow.up" size={16} />
                </View>
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Share it with your friends" />
                </ThemedText>
              </TouchableOpacity>
            )}
            {hasJoined && (
              <Link
                href={{ pathname: "/plan/[id]/chat", params: { id } }}
                asChild
              >
                <TouchableOpacity className="mt-2 flex-row items-center gap-2">
                  <View className="relative size-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Icon
                      name="bubble.left.and.text.bubble.right"
                      size={20}
                      color="#3b82f6"
                    />
                    {hasUnreadMessages && (
                      <View className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-primary" />
                    )}
                  </View>
                  <ThemedText className="text-blue-500 dark:text-blue-400">
                    <FormattedMessage defaultMessage="Chat with others" />
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            )}
            {hasJoined && !isCreator && (
              <TouchableOpacity
                onPress={() => handleLeave()}
                className="mt-2 flex-row items-center gap-2 opacity-80"
              >
                <View className="size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                  {isLoadingLeavePLan ? (
                    <ActivityIndicator size="sm" color="#ef4444" />
                  ) : (
                    <Icon name="arrow.down" size={16} muted color="#ef4444" />
                  )}
                </View>
                <ThemedText className="text-red-500">
                  <FormattedMessage defaultMessage="Leave" />
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {isOpen && (isCreator || !hasJoined) && (
        <View className="gap-4">
          <View className="flex-row justify-between">
            <ThemedText className="text-2xl font-semibold">
              <FormattedMessage defaultMessage="Actions" />
            </ThemedText>
            {isCreator && (
              <Link
                href={{ pathname: "/plan/[id]/edit", params: { id } }}
                asChild
              >
                <TouchableOpacity className="flex-row items-center gap-2">
                  <Icon name="gear" size={16} />
                  <ThemedText className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Modify plan" />
                  </ThemedText>
                </TouchableOpacity>
              </Link>
            )}
          </View>
          {!hasJoined && (
            <Button onPress={handleJoin} isLoading={isLoadingJoinPlan}>
              <FormattedMessage defaultMessage="Join plan" />
            </Button>
          )}
          {isOpen && isCreator && !!plan.startDate && (
            <Link
              href={{ pathname: "/plan/[id]/complete", params: { id } }}
              asChild
            >
              <Button intent="success">
                <FormattedMessage defaultMessage="Complete plan" />
              </Button>
            </Link>
          )}
          {isOpen && isCreator && !plan.startDate && (
            <Link
              href={{ pathname: "/plan/[id]/edit", params: { id } }}
              asChild
            >
              <Button intent="outline">
                <FormattedMessage defaultMessage="Set plan date" />
              </Button>
            </Link>
          )}
        </View>
      )}
      {!!plan.mountains?.length && <PlanSummits mountains={plan.mountains} />}
    </ParallaxScrollView>
  );
}
