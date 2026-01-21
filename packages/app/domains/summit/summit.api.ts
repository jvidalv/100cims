import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";
import { summitKeys } from "@/lib/query-keys";

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
    queryKey: [summitId],
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
    }: {
      summitId: string;
      summitedAt: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/summit/update",
        {
          body: { summitId, summitedAt },
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
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: summitKeys.reactions(variables.summitId),
      });
    },
  });
};
