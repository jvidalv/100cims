import { formatDistanceToNowStrict } from "date-fns";
import { useRouter } from "expo-router";
import { ArrowUp, Trash2 } from "lucide-react-native";
import { FormattedMessage } from "react-intl";
import { Alert, TouchableOpacity, View } from "react-native";

import { Avatar, LucideIcon, ThemedText } from "@/components/ui/atoms";
import { getDateFnsLocale } from "@/lib/locale";

export type CommentRowData = {
  id: string;
  parentCommentId: string | null;
  body: string;
  upvoteCount: number;
  viewerHasUpvoted: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    hasSummitedThisMountain: boolean;
  };
  // Present only in search-mode responses when this row is a reply.
  parent?: {
    id: string;
    body: string;
    user: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
      hasSummitedThisMountain: boolean;
    };
  };
  // Present only on top-level rows from /list — total replies for this thread.
  replyCount?: number;
};

type Props = {
  comment: CommentRowData;
  viewerId: string | null;
  onUpvote: () => void;
  // Optional — when omitted, the action is hidden.
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  // Rendered when comment.parent is set (search results). Opens the full
  // thread for the parent; caller decides how (usually "clear search").
  onOpenThread?: () => void;
};

export function CommentRow({
  comment,
  viewerId,
  onUpvote,
  onReply,
  onEdit,
  onDelete,
  onOpenThread,
}: Props) {
  const router = useRouter();
  const isMine = viewerId !== null && comment.user.id === viewerId;
  const authorName =
    comment.user.firstName || comment.user.username || "🥷";
  const createdDate = new Date(comment.createdAt);
  const relativeTime = formatDistanceToNowStrict(createdDate, {
    addSuffix: true,
    locale: getDateFnsLocale(),
  });

  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/user/[user]",
              params: { user: comment.user.id },
            })
          }
          className="flex-row items-center gap-2"
        >
          <Avatar
            size="xs"
            className="size-6"
            imageUrl={comment.user.imageUrl}
            initials={(comment.user.firstName ?? comment.user.username ?? "?")
              .slice(0, 2)
              .toUpperCase()}
          />
          <ThemedText className="font-medium text-muted-foreground">
            {authorName}
          </ThemedText>
        </TouchableOpacity>
        {comment.user.hasSummitedThisMountain && (
          <View className="rounded-full bg-emerald-500/15 px-1.5 pb-0.5 pt-1">
            <ThemedText
              style={{ fontSize: 9 }}
              className="font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              <FormattedMessage defaultMessage="Summited" />
            </ThemedText>
          </View>
        )}
        <TouchableOpacity
          onPress={() => Alert.alert(createdDate.toLocaleString())}
        >
          <ThemedText className="text-xs text-muted-foreground">
            {relativeTime}
          </ThemedText>
        </TouchableOpacity>
      </View>
      {comment.parent && (
        <View className="gap-1 rounded border-l-2 border-border pl-3">
          <ThemedText className="text-xs text-muted-foreground">
            <FormattedMessage
              defaultMessage="Replying to {name}"
              values={{
                name:
                  comment.parent.user.firstName ||
                  comment.parent.user.username ||
                  "🥷",
              }}
            />
          </ThemedText>
          <ThemedText
            numberOfLines={2}
            className="text-sm text-muted-foreground"
          >
            {comment.parent.body}
          </ThemedText>
          {onOpenThread && (
            <TouchableOpacity onPress={onOpenThread} className="pt-1">
              <ThemedText className="text-xs font-medium text-primary">
                <FormattedMessage defaultMessage="View full thread" />
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View className="rounded bg-muted/40 py-3">
        <ThemedText>{comment.body}</ThemedText>
      </View>
      <View className="flex-row items-center gap-4 pt-1">
        <TouchableOpacity
          onPress={onUpvote}
          className="flex-row items-center gap-1"
        >
          <LucideIcon
            icon={ArrowUp}
            size={16}
            color={comment.viewerHasUpvoted ? "#f97316" : undefined}
            muted={!comment.viewerHasUpvoted}
          />
          <ThemedText
            className={
              comment.viewerHasUpvoted
                ? "text-sm font-medium text-orange-500"
                : "text-sm text-muted-foreground"
            }
          >
            {comment.upvoteCount}
          </ThemedText>
        </TouchableOpacity>
        {onReply && (
          <TouchableOpacity onPress={onReply}>
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Reply" />
            </ThemedText>
          </TouchableOpacity>
        )}
        {isMine && onEdit && (
          <TouchableOpacity onPress={onEdit}>
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Edit" />
            </ThemedText>
          </TouchableOpacity>
        )}
        {isMine && onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            className="flex-row items-center gap-1"
          >
            <LucideIcon icon={Trash2} size={14} color="#ef4444" />
            <ThemedText className="text-sm text-red-500">
              <FormattedMessage defaultMessage="Delete" />
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
