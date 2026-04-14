import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";
import { summitKeys, userKeys } from "@/lib/query-keys";

export const SUMMITS_KEY = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => ["summits", mountainId, limit];

export const useSummitsGet = (
  {
    mountainId,
    limit,
  }: {
    mountainId?: string;
    limit?: number;
  } = { mountainId: undefined, limit: undefined },
  queryOptions?: {
    enabled?: boolean;
  },
) => {
  const query: { mountainId?: string; limit?: number } = {};

  if (mountainId) {
    query.mountainId = mountainId;
  }

  if (limit) {
    query.limit = limit;
  }

  return useQuery({
    queryKey: SUMMITS_KEY({ mountainId, limit }),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/mountains/summits",
        { params: { query } },
      );
      if (error) throw error;

      return data.message;
    },
    ...queryOptions,
  });
};

export const useSummitGet = ({ summitId }: { summitId: string }) => {
  const { isAuthenticated } = useAuth();

  const args = useQuery({
    queryKey: summitKeys.one(summitId),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET("/api/protected/summit/one", {
        params: { query: { summitId } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return args;
};

export const useDeleteSummitMutation = () => {
  return useMutation({
    mutationKey: ["summit", "delete"],
    mutationFn: async ({ summitId }: { summitId: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/summit/delete",
        {
          body: { summitId },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SUMMITS_KEY({
          mountainId: undefined,
          limit: undefined,
        }),
      });
    },
  });
};

export const useUpdateSummitMutation = () => {
  return useMutation({
    mutationKey: ["summit", "update"],
    mutationFn: async ({
      summitId,
      summitedAt,
      image,
      usersId,
    }: {
      summitId: string;
      summitedAt?: string;
      image?: string;
      usersId?: string[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/summit/update",
        {
          body: { summitId, summitedAt, image, usersId },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: SUMMITS_KEY({
          mountainId: undefined,
          limit: undefined,
        }),
      });
      void queryClient.invalidateQueries({
        queryKey: summitKeys.one(variables.summitId),
      });
      void queryClient.invalidateQueries({ queryKey: userKeys.summits() });
    },
  });
};

export const useSummitReactions = ({ summitId }: { summitId: string }) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: summitKeys.reactions(summitId),
    enabled: () => isAuthenticated && !!summitId,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/summit/reactions",
        { params: { query: { summitId } } },
      );
      if (error) throw error;
      return data.message;
    },
  });
};

type ReactionsData = {
  reactions: { emoji: string; count: number }[];
  userReactions: string[];
};

export const useSummitReactionMutation = () => {
  return useMutation({
    mutationKey: ["summit", "reaction"],
    mutationFn: async ({
      summitId,
      emoji,
    }: {
      summitId: string;
      emoji: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/summit/reaction",
        { body: { summitId, emoji } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ summitId, emoji }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: summitKeys.reactions(summitId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ReactionsData>(
        summitKeys.reactions(summitId),
      );

      // Optimistically update
      queryClient.setQueryData<ReactionsData>(
        summitKeys.reactions(summitId),
        (old) => {
          if (!old) return old;

          const userHasReacted = old.userReactions.includes(emoji);
          const newUserReactions = userHasReacted
            ? old.userReactions.filter((e) => e !== emoji)
            : [...old.userReactions, emoji];

          const newReactions = old.reactions.map((r) => {
            if (r.emoji === emoji) {
              return {
                ...r,
                count: userHasReacted ? r.count - 1 : r.count + 1,
              };
            }
            return r;
          });

          // If emoji doesn't exist yet, add it
          if (!userHasReacted && !old.reactions.some((r) => r.emoji === emoji)) {
            newReactions.push({ emoji, count: 1 });
          }

          // Filter out reactions with count 0
          const filteredReactions = newReactions.filter((r) => r.count > 0);

          return {
            reactions: filteredReactions,
            userReactions: newUserReactions,
          };
        },
      );

      return { previousData };
    },
    onError: (_, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          summitKeys.reactions(variables.summitId),
          context.previousData,
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Refetch after mutation settles
      void queryClient.invalidateQueries({
        queryKey: summitKeys.reactions(variables.summitId),
      });
    },
  });
};
