import { format } from "date-fns/format";
import { isSameDay } from "date-fns/isSameDay";
import * as Clipboard from "expo-clipboard";
import { Link, useLocalSearchParams } from "expo-router";
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
import { twMerge } from "tailwind-merge";

import {
  Icon,
  Avatar,
  ThemedKeyboardAvoidingView,
  ActivityIndicator,
  EnrichedThemedText,
  ThemedText,
  Skeleton,
  BlurView,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { pastelColors } from "@/constants/colors";
import {
  usePlanChatMessages,
  usePlanChatSendMessage,
  usePlanChatRead,
  usePlanChatDeleteMessage,
} from "@/domains/plan/plan-chat.api";
import { usePlanOne } from "@/domains/plan/plan.api";
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const intl = useIntl();
  const inputRef = useRef<TextInput>(null);
  const [message, setMessage] = useState("");

  const { data: user } = useUserMe();
  const { data: planData } = usePlanOne({ id });
  const plan = planData;

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
    if (!message.trim()) return;
    await sendMessage({ planId: id, message });
    setMessage("");
    readChat(id);
    inputRef.current?.blur();
  };

  if (!plan) return null;

  return (
    <View className="relative flex-1">
      <View className="border-b border-border bg-background pt-2">
        <ScreenHeader
          rightElement={
            <Link href="/user/suggestions" className="pr-6">
              <Icon name="questionmark.circle" />
            </Link>
          }
        >
          {plan.title}
        </ScreenHeader>
      </View>
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
        <View className="relative flex-1">
          {!isPendingMessages && !messages?.length && (
            <BlurView className="relative mx-6 mt-8 gap-1 overflow-hidden rounded-xl border border-border p-4">
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
            onDeleteMessage={(id) =>
              Alert.alert(
                intl.formatMessage({ defaultMessage: "Delete message?" }),
                intl.formatMessage({ defaultMessage: "This can't be undone." }),
                [
                  { text: intl.formatMessage({ defaultMessage: "Cancel" }) },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMessage(id),
                  },
                ],
              )
            }
          />
          <View
            className={twMerge(
              "border-t border-border bg-background px-4 pb-10 pt-2",
              isKeyboardVisible && "pb-2",
            )}
          >
            <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-border bg-border/50 pl-4">
              <TextInput
                ref={inputRef}
                className="h-12 flex-1 text-foreground text-base"
                value={message}
                onChangeText={setMessage}
                placeholder={intl.formatMessage({
                  defaultMessage: "Type here...",
                })}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSendingMessage}
                className={twMerge(
                  "h-10 w-12 items-center justify-center rounded-xl mr-1 border bg-border border-border",
                  !!message && "bg-emerald-500 border-emerald-500",
                  isSendingMessage && "opacity-70",
                )}
              >
                {isSendingMessage ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Icon
                    name="paperplane"
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
      className="flex-1 px-4 pt-4"
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
                  "max-w-[75%] rounded-xl px-4 py-2 shadow-xs",
                  isMine ? "self-end bg-neutral-200 dark:bg-neutral-700" : "",
                  !isMine && !showAvatar && "ml-10",
                )}
              >
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
