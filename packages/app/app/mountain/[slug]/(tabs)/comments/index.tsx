import { useGlobalSearchParams, useRouter } from "expo-router";
import {
  ArrowUp,
  Clock,
  History,
  MessageCircle,
  Plus,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BlurredScreenHeader,
  useBlurredScreenHeaderHeight,
} from "@/components/ui/molecules";
import {
  CommentRow,
  type CommentRowData,
} from "@/components/ui/molecules/comment-row";
import {
  ImagePreviewModal,
  useImagePreview,
} from "@/components/ui/molecules/image-preview-modal";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import {
  useDeleteMountainComment,
  useMountainComments,
  useThreadReplies,
  useUpvoteMountainComment,
} from "@/domains/mountain-comments/mountain-comments.api";
import { useUserMe } from "@/domains/user/user.api";

import type { LucideIcon as LucideIconType } from "lucide-react-native";

type SortValue = "newest" | "oldest" | "top";

// Flat row shape consumed by the FlatList. Can be an actual comment or a
// control row (expand / load-all) rendered inside a thread.
type DisplayRow =
  | {
      type: "comment";
      key: string;
      depth: 0 | 1;
      comment: CommentRowData;
      topLevelId: string;
    }
  | {
      type: "show-more";
      // How many replies are hidden behind this button (already in memory).
      hidden: number;
      topLevelId: string;
      key: string;
    }
  | {
      type: "show-all";
      // Total replies in the thread; client will fetch the remainder.
      total: number;
      topLevelId: string;
      key: string;
    }
  | {
      type: "loading-thread";
      topLevelId: string;
      key: string;
    };

// Tiny inline debounce — no need for a shared util at this scale.
const useDebounced = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(h);
  }, [value, delayMs]);
  return debounced;
};

export default function MountainCommentsScreen() {
  const intl = useIntl();
  const router = useRouter();
  // `useSafeAreaInsets().bottom` on a NativeTabs child already includes
  // the tab bar height (iOS bumps it for UITabBarController children) —
  // don't add the bar height again. +12 is just a small visual buffer
  // above the tab bar's top edge.
  const { bottom: bottomInset } = useSafeAreaInsets();
  const blurredHeaderHeight = useBlurredScreenHeaderHeight();
  const fabBottomOffset = bottomInset + 12;
  // useGlobalSearchParams (not useLocalSearchParams) — see comment in summit.tsx.
  const { slug } = useGlobalSearchParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: mountain } = useMountainOne({ mountainSlug: slug });
  const { data: me } = useUserMe();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");
  // Bumped each time we need to visually clear the uncontrolled SearchInput.
  const [searchInputKey, setSearchInputKey] = useState(0);
  // Thread expansion state.
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    () => new Set(),
  );
  // Threads for which the user asked "Show all" — kicks off the /replies fetch.
  const [loadAllThreadId, setLoadAllThreadId] = useState<string | null>(null);
  const debouncedQuery = useDebounced(query, 300);
  const searchMode = debouncedQuery.trim().length > 0;

  const clearSearch = () => {
    setQuery("");
    setSearchInputKey((k) => k + 1);
  };

  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMountainComments(mountain?.id, {
      q: debouncedQuery,
      sort,
    });

  const upvote = useUpvoteMountainComment(mountain?.id ?? "");
  const remove = useDeleteMountainComment(mountain?.id ?? "");
  const { previewImage, isPreviewOpen, openPreview, closePreview } =
    useImagePreview();
  const onImagePress = (uri: string) => openPreview({ uri });
  const {
    data: loadedAllReplies,
    isFetching: isFetchingAllReplies,
  } = useThreadReplies(loadAllThreadId ?? undefined, !!loadAllThreadId);

  const openComposer = (params?: {
    parentCommentId?: string;
    editCommentId?: string;
  }) => {
    if (!isAuthenticated) {
      router.push("/join");
      return;
    }
    router.push({
      pathname: "/mountain/[slug]/comments/new",
      params: { slug, ...params },
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

  // Flatten API pages → CommentRowData[].
  const items: CommentRowData[] = useMemo(
    () =>
      (data?.pages ?? []).flatMap((page) =>
        page.items.map((c) => ({
          id: c.id,
          parentCommentId: c.parentCommentId,
          body: c.body,
          images: c.images,
          upvoteCount: c.upvoteCount,
          viewerHasUpvoted: c.viewerHasUpvoted,
          createdAt: String(c.createdAt),
          user: c.user,
          parent: c.parent,
          replyCount: c.replyCount,
        })),
      ),
    [data],
  );

  // Build the FlatList feed.
  //  - Search mode: everything flat, no indent.
  //  - Non-search: top-level + max 1 reply by default. "Show N more replies"
  //    expands to the inline cap (3 from /list). "Show all N" loads the
  //    remainder via /replies.
  const rows: DisplayRow[] = useMemo(() => {
    if (searchMode) {
      return items.map((c) => ({
        type: "comment" as const,
        key: c.id,
        depth: 0 as const,
        comment: c,
        topLevelId: c.id,
      }));
    }
    const topLevel = items.filter((c) => c.parentCommentId === null);
    const repliesByParent = new Map<string, CommentRowData[]>();
    for (const c of items) {
      if (c.parentCommentId) {
        const list = repliesByParent.get(c.parentCommentId) ?? [];
        list.push(c);
        repliesByParent.set(c.parentCommentId, list);
      }
    }
    const out: DisplayRow[] = [];
    for (const t of topLevel) {
      out.push({
        type: "comment",
        key: t.id,
        depth: 0,
        comment: t,
        topLevelId: t.id,
      });

      const inlineReplies = repliesByParent.get(t.id) ?? [];
      const replyCount = t.replyCount ?? inlineReplies.length;
      const expanded = expandedThreads.has(t.id);
      const showingAll = loadAllThreadId === t.id && !!loadedAllReplies;

      if (replyCount === 0) continue;

      if (showingAll) {
        // Fully loaded via /replies — render everything we got back.
        for (const r of loadedAllReplies ?? []) {
          out.push({
            type: "comment",
            key: r.id,
            depth: 1,
            comment: {
              id: r.id,
              parentCommentId: r.parentCommentId,
              body: r.body,
              images: r.images,
              upvoteCount: r.upvoteCount,
              viewerHasUpvoted: r.viewerHasUpvoted,
              createdAt: String(r.createdAt),
              user: r.user,
            },
            topLevelId: t.id,
          });
        }
        continue;
      }

      if (loadAllThreadId === t.id && isFetchingAllReplies) {
        // Waiting for /replies to come back — keep the inline ones visible
        // and append a loading indicator row.
        for (const r of inlineReplies) {
          out.push({
            type: "comment",
            key: r.id,
            depth: 1,
            comment: r,
            topLevelId: t.id,
          });
        }
        out.push({
          type: "loading-thread",
          key: `${t.id}-loading`,
          topLevelId: t.id,
        });
        continue;
      }

      // Partial view: either 1 reply collapsed or up to 3 expanded.
      const visible = expanded ? inlineReplies : inlineReplies.slice(0, 1);
      for (const r of visible) {
        out.push({
          type: "comment",
          key: r.id,
          depth: 1,
          comment: r,
          topLevelId: t.id,
        });
      }

      if (!expanded && replyCount > 1) {
        // "Show N more replies" — N is replyCount - 1 since 1 is already shown.
        out.push({
          type: "show-more",
          key: `${t.id}-show-more`,
          hidden: replyCount - 1,
          topLevelId: t.id,
        });
      } else if (expanded && replyCount > inlineReplies.length) {
        // Inline cap exceeded — client needs the rest via /replies.
        out.push({
          type: "show-all",
          key: `${t.id}-show-all`,
          total: replyCount,
          topLevelId: t.id,
        });
      }
    }
    return out;
  }, [
    items,
    searchMode,
    expandedThreads,
    loadAllThreadId,
    loadedAllReplies,
    isFetchingAllReplies,
  ]);

  const sortOptions: {
    value: SortValue;
    label: string;
    icon: LucideIconType;
  }[] = useMemo(
    () => [
      {
        value: "newest",
        label: intl.formatMessage({ defaultMessage: "Newest" }),
        icon: Clock,
      },
      {
        value: "oldest",
        label: intl.formatMessage({ defaultMessage: "Oldest" }),
        icon: History,
      },
      {
        value: "top",
        label: intl.formatMessage({ defaultMessage: "Most upvoted" }),
        icon: ArrowUp,
      },
    ],
    [intl],
  );

  if (!mountain) {
    return (
      <ThemedView className="flex-1">
        <BlurredScreenHeader />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="max-w-56 text-lg font-medium">
          {mountain.name}
        </ThemedText>
      </BlurredScreenHeader>

      {/* Pinned header: search + sort chips */}
      <View
        className="gap-3 px-6 pt-3"
        style={{ paddingTop: blurredHeaderHeight + 12 }}
      >
        <SearchInput
          key={searchInputKey}
          onChangeText={setQuery}
          placeholder={intl.formatMessage({
            defaultMessage: "Search comments…",
          })}
        />
      </View>
      <View className="flex-row gap-2 px-6 py-3">
        {sortOptions.map((option) => {
          const selected = sort === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSort(option.value)}
              className={twMerge(
                "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5",
                selected ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              <LucideIcon
                icon={option.icon}
                size={14}
                primary={selected}
                muted={!selected}
              />
              <ThemedText
                className={twMerge(
                  "text-sm font-medium",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-6 pb-32 pt-2"
        initialNumToRender={15}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isPending ? (
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="Loading…" />
            </ThemedText>
          ) : (
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
                    onPress={() => openComposer()}
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
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-6">
              <ActivityIndicator />
            </View>
          ) : null
        }
        renderItem={({ item: row, index }) => {
          if (row.type === "comment") {
            const isTopLevel = row.depth === 0;
            return (
              <View
                className={
                  row.depth === 1
                    ? "ml-8 border-l border-border pl-3"
                    : isTopLevel && index > 0
                      ? "mt-4"
                      : undefined
                }
              >
                <CommentRow
                  comment={row.comment}
                  viewerId={me?.id ?? null}
                  onUpvote={() => {
                    if (!isAuthenticated) {
                      router.push("/join");
                      return;
                    }
                    upvote.mutate(row.comment.id);
                  }}
                  onReply={() =>
                    openComposer({ parentCommentId: row.topLevelId })
                  }
                  onEdit={() =>
                    openComposer({ editCommentId: row.comment.id })
                  }
                  onDelete={() => confirmDelete(row.comment.id)}
                  onOpenThread={searchMode ? clearSearch : undefined}
                  onImagePress={onImagePress}
                />
              </View>
            );
          }
          if (row.type === "show-more") {
            return (
              <View className="ml-8 border-l border-border pl-3">
                <TouchableOpacity
                  onPress={() =>
                    setExpandedThreads((prev) => {
                      const next = new Set(prev);
                      next.add(row.topLevelId);
                      return next;
                    })
                  }
                >
                  <ThemedText className="text-sm font-medium text-primary">
                    {row.hidden === 1 ? (
                      <FormattedMessage defaultMessage="Show 1 more reply" />
                    ) : (
                      <FormattedMessage
                        defaultMessage="Show {count} more replies"
                        values={{ count: row.hidden }}
                      />
                    )}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          }
          if (row.type === "show-all") {
            return (
              <View className="ml-8 border-l border-border pl-3">
                <TouchableOpacity
                  onPress={() => setLoadAllThreadId(row.topLevelId)}
                >
                  <ThemedText className="text-sm font-medium text-primary">
                    <FormattedMessage
                      defaultMessage="Show all {count} replies"
                      values={{ count: row.total }}
                    />
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          }
          // loading-thread
          return (
            <View className="ml-8 border-l border-border pl-3">
              <ActivityIndicator size="small" />
            </View>
          );
        }}
      />

      {items.length > 0 && (
        <TouchableOpacity
          onPress={() => openComposer()}
          className="absolute right-6 z-10 size-16 items-center justify-center rounded-full bg-primary shadow-lg"
          style={{ bottom: fabBottomOffset }}
        >
          <LucideIcon icon={Plus} size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
    </ThemedView>
  );
}
