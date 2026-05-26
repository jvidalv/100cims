import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { mountainKeys } from "@/lib/query-keys";

export type CommentsListParams = {
  q?: string;
  sort?: "newest" | "oldest" | "top";
  onlySummiters?: boolean;
};

export const useMountainComments = (
  mountainId: string | undefined,
  params: CommentsListParams = {},
) => {
  return useInfiniteQuery({
    queryKey: mountainId
      ? [...mountainKeys.comments(mountainId), params]
      : ["noop"],
    enabled: !!mountainId,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET(
        "/api/public/mountain-comments/list",
        {
          params: {
            query: {
              mountainId: mountainId!,
              cursor: pageParam,
              q: params.q || undefined,
              sort: params.sort,
              onlySummiters: params.onlySummiters || undefined,
            },
          },
        },
      );
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useTopMountainComments = (mountainId: string | undefined) => {
  return useQuery({
    queryKey: mountainId ? mountainKeys.topComments(mountainId) : ["noop"],
    enabled: !!mountainId,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/mountain-comments/top",
        { params: { query: { mountainId: mountainId! } } },
      );
      if (error) throw error;
      return data.message;
    },
  });
};

// Fetches every reply for a single thread. Used when the user taps
// "Show all N replies" on a thread with more than the inline cap (3).
export const useThreadReplies = (
  parentCommentId: string | undefined,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: parentCommentId
      ? (["mountain", "comments", "thread", parentCommentId] as const)
      : ["noop"],
    enabled: enabled && !!parentCommentId,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/mountain-comments/replies",
        { params: { query: { parentCommentId: parentCommentId! } } },
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export const useCreateMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      body: string;
      parentCommentId?: string;
      // Up to 5 base64-encoded JPEGs. Backend uploads each to S3 and stores
      // the resolved URLs on the new mountain_comment.images JSONB column.
      images?: string[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountain-comments/create",
        {
          body: {
            mountainId,
            body: input.body,
            parentCommentId: input.parentCommentId,
            images: input.images,
          },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mountainKeys.comments(mountainId),
      });
    },
  });
};

export const useUpdateMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      body: string;
      // Mixed array of existing image URLs (kept) and new base64 JPEGs
      // (uploaded server-side). Omit to leave images untouched; pass `[]`
      // to remove all images.
      images?: string[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountain-comments/update",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mountainKeys.comments(mountainId),
      });
    },
  });
};

export const useUpvoteMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountain-comments/upvote",
        { body: { commentId } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mountainKeys.comments(mountainId),
      });
    },
  });
};

export const useDeleteMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountain-comments/delete",
        { body: { id } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: mountainKeys.comments(mountainId),
      });
    },
  });
};
