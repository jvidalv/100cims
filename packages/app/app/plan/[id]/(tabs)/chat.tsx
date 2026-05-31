import { format } from "date-fns/format";
import { isSameDay } from "date-fns/isSameDay";
import * as Clipboard from "expo-clipboard";
import { Link, useGlobalSearchParams } from "expo-router";
import { CircleHelp, Send } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";


import { useAuth } from "@/components/providers/auth-provider";
import {
  LucideIcon,
  Avatar,
  ThemedKeyboardAvoidingView,
  ActivityIndicator,
  EnrichedThemedText,
  ThemedText,
  Skeleton,
  BlurView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import { pastelColors } from "@/constants/colors";
import {
  usePlanChatMessages,
  usePlanChatSendMessage,
  usePlanChatRead,
  usePlanChatDeleteMessage,
} from "@/domains/plan/plan-chat.api";
import { usePlanJoin, usePlanOne } from "@/domains/plan/plan.api";
import { useUserMe } from "@/domains/user/user.api";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";

function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

export default function PlanChatPage() {
  // useGlobalSearchParams (not useLocal-) — inside a NativeTabs eagerly-mounted
  // child of [id], useLocalSearchParams doesn't bind the parent dynamic. The
  // param is briefly undefined during that mount window; every downstream
  // hook gates on it via its `enabled` callback so we don't fire requests
  // with `planId=undefined`.
  const { id } = useGlobalSearchParams<{ id?: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { bottom: bottomInset } = useSafeAreaInsets();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();

  const intl = useIntl();
  const inputRef = useRef<TextInput>(null);
  const [message, setMessage] = useState("");

  const { data: user } = useUserMe();
  const { isAuthenticated } = useAuth();
  const { data: planData } = usePlanOne({ id });
  const plan = planData;
  const hasJoined = !!user?.id && !!plan?.users.some((u) => u.id === user.id);
  // Source of truth for the "Organizer" badge in chat. Read off the same
  // plan.users array that powers the participant list so the two stay in
  // sync without an extra fetch.
  const organizerIds = useMemo(
    () =>
      new Set(
        plan?.users.filter((u) => u.role === "organizer").map((u) => u.id) ??
          [],
      ),
    [plan?.users],
  );
  const { mutateAsync: joinPlan, isPending: isJoining } = usePlanJoin(id);

  const { data: messagesData, isPending: isPendingMessages } =
    usePlanChatMessages(id);
  const { mutateAsync: sendMessage, isPending: isSendingMessage } =
    usePlanChatSendMessage();
  const { mutate: readChat } = usePlanChatRead();
  const { mutate: deleteMessage } = usePlanChatDeleteMessage();

  const isKeyboardVisible = useIsKeyboardVisible();
  const messages = useMemo(
    () => [...(messagesData ?? [])].reverse(),
    [messagesData],
  );

  useEffect(() => {
    if (!id) return;
    readChat(id);

    return () => {
      readChat(id);
    };
  }, [id, readChat]);

  const handleSend = async () => {
    if (!message.trim() || !id) return;
    await sendMessage({ planId: id, message });
    setMessage("");
    readChat(id);
    inputRef.current?.blur();
  };

  if (!plan) return null;

  // Join gate — non-joined users (anonymous OR logged in but not a
  // participant) see a CTA instead of the chat. Joining or signing in
  // brings them into the chat in place.
  if (!hasJoined) {
    return (
      <View className="relative flex-1">
        <BlurredScreenHeader>{plan.title}</BlurredScreenHeader>
        <View className="flex-1 items-center justify-center gap-6 px-6">
          {/* Bigger, bolder empty-state copy. The icon adds visual weight
              so the title doesn't sit alone on the screen. */}
          <View className="size-20 items-center justify-center rounded-full bg-primary/10">
            <LucideIcon icon={Send} size={36} primary />
          </View>
          <ThemedText className="text-center text-3xl font-bold tracking-tight">
            {isAuthenticated
              ? intl.formatMessage({
                  defaultMessage: "Join the plan to see and write messages",
                })
              : intl.formatMessage({
                  defaultMessage: "Sign in to join the plan and chat",
                })}
          </ThemedText>
          {/* Button shrinks to its content rather than stretching full-width. */}
          <View className="self-center">
            {isAuthenticated ? (
              <ActionRow
                icon={Send}
                intent="primary"
                size="lg"
                disabled={isJoining}
                iconOverride={
                  isJoining ? <ActivityIndicator size="sm" /> : undefined
                }
                onPress={() => {
                  void joinPlan();
                }}
              >
                <FormattedMessage defaultMessage="Join plan" />
              </ActionRow>
            ) : (
              <Link href="/join" asChild>
                <ActionRow icon={Send} intent="primary" size="lg">
                  <FormattedMessage defaultMessage="Sign in" />
                </ActionRow>
              </Link>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="relative flex-1">
      <BlurredScreenHeader
        rightElement={
          <Link href="/user/suggestions" asChild>
            <TouchableOpacity hitSlop={16}>
              <LucideIcon icon={CircleHelp} size={22} />
            </TouchableOpacity>
          </Link>
        }
      >
        {plan.title}
      </BlurredScreenHeader>
      <ThemedKeyboardAvoidingView>
        <ImageBackground
          source={
            isDark
              ? require("@/assets/images/chat-bg-dark.png")
              : require("@/assets/images/chat-bg-light.png")
          }
          resizeMode="repeat"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
          }}
        />
        <View
          className="relative flex-1"
          style={{ paddingTop: blurredHeaderHeight }}
        >
          {!isPendingMessages && !messages?.length && (
            <BlurView className="relative mx-6 mt-8 gap-1 overflow-hidden rounded border border-border p-4">
              <View className="absolute right-2 top-2">
                <ThemedText>💬</ThemedText>
              </View>
              <ThemedText className="font-medium">
                <FormattedMessage defaultMessage="Start the conversation" />
              </ThemedText>
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="Good communication helps everyone enjoy the experience. Feel free to share ideas, ask questions, or align expectations like speed and difficulty." />
              </ThemedText>
            </BlurView>
          )}
          {isPendingMessages && (
            <View className="absolute -top-20 bottom-0 size-full flex-col justify-end gap-2 p-6">
              <View className="flex-row gap-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-10 w-56" />
              </View>
              <View className="flex-row items-end justify-end gap-2">
                <Skeleton className="h-16 w-56" />
              </View>
              <View className="flex-row gap-2">
                <Skeleton className="size-10 rounded-full" />
                <View className="gap-2">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-16 w-56" />
                  <Skeleton className="h-10 w-56" />
                </View>
              </View>
              <View className="flex-row items-end justify-end gap-2">
                <Skeleton className="h-10 w-56" />
              </View>
            </View>
          )}
          <MessageList
            messages={messages}
            currentUserId={user?.id}
            organizerIds={organizerIds}
            onDeleteMessage={(id) =>
              Alert.alert(
                intl.formatMessage({ defaultMessage: "Delete message?" }),
                intl.formatMessage({ defaultMessage: "This can't be undone." }),
                [
                  { text: intl.formatMessage({ defaultMessage: "Cancel" }) },
                  {
                    text: intl.formatMessage({ defaultMessage: "Delete" }),
                    style: "destructive",
                    onPress: () => deleteMessage(id),
                  },
                ],
              )
            }
          />
          <View
            className="border-t border-border bg-background px-4 py-2"
            // `useSafeAreaInsets().bottom` inside a NativeTabs screen
            // already accounts for the tab bar height (iOS bumps it for
            // children of a UITabBarController), so we don't add the bar
            // height manually — that would double-count. When the keyboard
            // is up the OS hides the bar, just a small inline gap.
            // Note: keyboard-visible state overrides the className's pb-2
            // (style wins over className), so it falls back to 8pt then.
            style={{ paddingBottom: isKeyboardVisible ? 8 : bottomInset + 8 }}
          >
            <View className="min-h-12 flex-row items-end gap-2 rounded-3xl bg-border/50 pl-4 pr-1.5 py-1.5">
              <TextInput
                ref={inputRef}
                className="flex-1 text-foreground text-base py-2"
                style={{ maxHeight: 100 }}
                value={message}
                onChangeText={setMessage}
                placeholder={intl.formatMessage({
                  defaultMessage: "Type here...",
                })}
                multiline
                blurOnSubmit={false}
                submitBehavior="newline"
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSendingMessage}
                className={twMerge(
                  "size-10 items-center justify-center rounded-full bg-border",
                  !!message && "bg-primary",
                  isSendingMessage && "opacity-70",
                )}
              >
                {isSendingMessage ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <LucideIcon
                    icon={Send}
                    muted={!message}
                    color={!!message ? "white" : undefined}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ThemedKeyboardAvoidingView>
    </View>
  );
}

function MessageList({
  messages,
  currentUserId,
  organizerIds,
  onDeleteMessage,
}: {
  messages: {
    id: string;
    message: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  }[];
  currentUserId?: string;
  organizerIds: Set<string>;
  onDeleteMessage: (id: string) => void;
}) {
  const intl = useIntl();

  const onLongPressMessage = (messageId: string, messageText: string) => {
    const deleteLabel = intl.formatMessage({
      defaultMessage: "Delete message",
    });
    const copyLabel = intl.formatMessage({ defaultMessage: "Copy message" });
    const cancelLabel = intl.formatMessage({ defaultMessage: "Cancel" });
    const optionsLabel = intl.formatMessage({ defaultMessage: "Options" });
    const selectOneLabel = intl.formatMessage({ defaultMessage: "Select one" });

    const handleCopy = () => Clipboard.setStringAsync(messageText);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [cancelLabel, copyLabel, deleteLabel],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) void handleCopy();
          if (buttonIndex === 2) onDeleteMessage(messageId);
        },
      );
    } else {
      Alert.alert(optionsLabel, selectOneLabel, [
        {
          text: copyLabel,
          // onPress: handleCopy,
        },
        {
          text: deleteLabel,
          style: "destructive",
          onPress: () => onDeleteMessage(messageId),
        },
        { text: cancelLabel, style: "cancel" },
      ]);
    }
  };

  return (
    <FlatList
      className="flex-1"
      contentContainerClassName="px-4 pt-4"
      data={messages}
      inverted
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        const isMine = item.user.id === currentUserId;
        const showAvatar =
          index === messages.length - 1 ||
          messages[index + 1]?.user.id !== item.user.id;
        const bubbleColor = isMine ? undefined : getUserColor(item.user.id);
        const isFirstOfDay =
          index === messages.length - 1 ||
          !isSameDay(item.createdAt, messages[index + 1]?.createdAt);

        const isLastOfGroup =
          index === 0 || messages[index - 1]?.user.id !== item.user.id;

        const isOrganizer = organizerIds.has(item.user.id);
        // Badge sits on the first message of each organizer's run, mirroring
        // the avatar's `showAvatar` rule so the user sees the role label
        // exactly where they see who's talking. Self-authored messages
        // (right-aligned, no avatar) get the badge too — useful for the
        // organizer's own confirmation that the role is active.
        const showOrganizerBadge = isOrganizer && showAvatar;

        return (
          <View>
            {isFirstOfDay && (
              <View className="mb-4 items-center pt-2">
                <ThemedText className="text-sm text-muted-foreground">
                  {format(item.createdAt, "dd MMM yyyy")}
                </ThemedText>
              </View>
            )}
            <View
              className={twMerge(
                "mb-2 flex-row gap-2",
                isMine ? "justify-end" : "justify-start",
              )}
            >
              {!isMine && showAvatar && (
                <Link
                  href={{
                    pathname: "/user/[user]",
                    params: { user: item.user.id },
                  }}
                >
                  <Avatar
                    imageUrl={item.user.imageUrl}
                    size="xs"
                    initials={
                      item.user.firstName?.[0]?.toUpperCase() ??
                      item.user.lastName?.[0]?.toUpperCase() ??
                      "?"
                    }
                    className="border border-border"
                  />
                </Link>
              )}
              <TouchableOpacity
                style={
                  !isMine ? { backgroundColor: bubbleColor?.bg } : undefined
                }
                onLongPress={() =>
                  isMine && onLongPressMessage(item.id, item.message)
                }
                className={twMerge(
                  "max-w-[75%] rounded px-4 py-2 shadow-xs",
                  isMine ? "self-end bg-neutral-200 dark:bg-neutral-700" : "",
                  !isMine && !showAvatar && "ml-10",
                )}
              >
                {showOrganizerBadge && (
                  <View
                    className={twMerge(
                      "mb-1 self-start rounded-full bg-blue-500/15 px-2 py-0.5",
                      isMine && "self-end",
                    )}
                  >
                    <ThemedText className="text-[10px] font-medium text-blue-500">
                      <FormattedMessage defaultMessage="Organizer" />
                    </ThemedText>
                  </View>
                )}
                <EnrichedThemedText
                  className={twMerge(isMine ? "text-foreground" : "text-black")}
                >
                  {item.message}
                </EnrichedThemedText>
                {isLastOfGroup && (
                  <ThemedText
                    className={twMerge(
                      "pt-1 text-right text-xs text-muted-foreground",
                      !isMine && "text-black/50",
                    )}
                  >
                    {format(item.createdAt, "HH:mm")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      keyboardShouldPersistTaps="handled"
    />
  );
}
