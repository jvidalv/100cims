import { useRouter } from "expo-router";
import { ChevronDown, MessageCircle, Plus } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { ActionRow } from "@/components/ui/molecules/action-row";
import {
  CommentRow,
  type CommentRowData,
} from "@/components/ui/molecules/comment-row";
import {
  useDeleteMountainComment,
  useUpvoteMountainComment,
} from "@/domains/mountain-comments/mountain-comments.api";
import { useUserMe } from "@/domains/user/user.api";

type Props = {
  mountainSlug: string;
  mountainId: string;
  isAuthenticated: boolean;
  items: CommentRowData[];
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  isPending: boolean;
  searchMode?: boolean;
  hideTitle?: boolean;
  hideComposer?: boolean;
  // Called from a reply's "View full thread" button (search mode only).
  onOpenThread?: () => void;
};

export function MountainCommentsSection({
  mountainSlug,
  mountainId,
  isAuthenticated,
  items,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isPending,
  searchMode,
  hideTitle,
  hideComposer,
  onOpenThread,
}: Props) {
  const intl = useIntl();
  const router = useRouter();
  const { data: me } = useUserMe();
  const upvote = useUpvoteMountainComment(mountainId);
  const remove = useDeleteMountainComment(mountainId);

  const topLevel = searchMode
    ? items
    : items.filter((c) => c.parentCommentId === null);
  const repliesByParent = new Map<string, CommentRowData[]>();
  if (!searchMode) {
    for (const c of items) {
      if (c.parentCommentId) {
        const list = repliesByParent.get(c.parentCommentId) ?? [];
        list.push(c);
        repliesByParent.set(c.parentCommentId, list);
      }
    }
  }

  const goToComposer = (params?: {
    parentCommentId?: string;
    editCommentId?: string;
  }) => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    router.push({
      pathname: "/mountain/[slug]/comments/new",
      params: { slug: mountainSlug, ...params },
    });
  };

  const confirmDelete = (id: string) =>
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete this comment?" }),
      undefined,
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Delete" }),
          style: "destructive",
          onPress: () => remove.mutate(id),
        },
      ],
    );

  return (
    <View className="gap-4">
      {!hideTitle && (
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Comments" />
        </ThemedText>
      )}

      {!searchMode && !hideComposer && (
        <ActionRow
          icon={MessageCircle}
          intent="blue"
          size="sm"
          onPress={() => goToComposer()}
        >
          <FormattedMessage defaultMessage="Add comment" />
        </ActionRow>
      )}

      {isPending && items.length === 0 && (
        <ThemedText className="text-muted-foreground">
          <FormattedMessage defaultMessage="Loading…" />
        </ThemedText>
      )}

      {!isPending && items.length === 0 && (
        <View className="items-center gap-4 py-12">
          <View className="items-center justify-center rounded-full bg-muted/40 p-4">
            <LucideIcon icon={MessageCircle} size={32} muted />
          </View>
          {searchMode ? (
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="No comments match your search." />
            </ThemedText>
          ) : (
            <>
              <ThemedText className="text-center text-lg font-semibold">
                <FormattedMessage defaultMessage="No comments yet" />
              </ThemedText>
              <ThemedText className="text-center text-muted-foreground">
                <FormattedMessage defaultMessage="Be the first to share tips, warnings or recent conditions." />
              </ThemedText>
              <TouchableOpacity
                onPress={() => goToComposer()}
                className="mt-2 flex-row items-center gap-2 rounded-full bg-primary px-4 py-2.5"
              >
                <LucideIcon icon={Plus} size={18} color="#ffffff" />
                <ThemedText className="font-semibold text-white">
                  <FormattedMessage defaultMessage="Add the first comment" />
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <View className="gap-4">
        {topLevel.map((c) => {
          // The top-level's own parent id tells us if this row itself is a
          // reply (true only in search mode).
          const topLevelIdForReply =
            c.parentCommentId === null ? c.id : c.parentCommentId;
          return (
            <View key={c.id} className="gap-4">
              <CommentRow
                comment={c}
                viewerId={me?.id ?? null}
                onUpvote={() => {
                  if (!isAuthenticated) {
                    router.push("/join");
                    return;
                  }
                  upvote.mutate(c.id);
                }}
                onReply={() =>
                  goToComposer({ parentCommentId: topLevelIdForReply })
                }
                onEdit={() => goToComposer({ editCommentId: c.id })}
                onDelete={() => confirmDelete(c.id)}
                onOpenThread={onOpenThread}
              />
              {!searchMode &&
                (repliesByParent.get(c.id) ?? []).length > 0 && (
                  <View className="ml-8 gap-5 border-l border-border pl-3">
                    {(repliesByParent.get(c.id) ?? []).map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        viewerId={me?.id ?? null}
                        onUpvote={() => {
                          if (!isAuthenticated) {
                            router.push("/join");
                            return;
                          }
                          upvote.mutate(reply.id);
                        }}
                        onReply={() => goToComposer({ parentCommentId: c.id })}
                        onEdit={() =>
                          goToComposer({ editCommentId: reply.id })
                        }
                        onDelete={() => confirmDelete(reply.id)}
                      />
                    ))}
                  </View>
                )}
            </View>
          );
        })}
      </View>

      {hasNextPage && (
        <ActionRow
          icon={ChevronDown}
          intent="muted"
          size="sm"
          disabled={isFetchingNextPage}
          onPress={() => fetchNextPage()}
        >
          {isFetchingNextPage ? (
            <ActivityIndicator size="small" />
          ) : (
            <FormattedMessage defaultMessage="Load more" />
          )}
        </ActionRow>
      )}
    </View>
  );
}
