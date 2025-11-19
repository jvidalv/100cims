import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";

export const SUMMITS_KEY = ({
  challengeId,
  mountainId,
  limit,
}: {
  challengeId: string;
  mountainId?: string;
  limit?: number;
}) => ["summits", challengeId, mountainId, limit];

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
  const { challengeId } = useChallenge();
  let query: { challengeId: string; mountainId?: string; limit?: number } = {
    challengeId,
  };

  if (mountainId) {
    query.mountainId = mountainId;
  }

  if (limit) {
    query.limit = limit;
  }

  return useQuery({
    queryKey: SUMMITS_KEY({ mountainId, limit, challengeId }),
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
  const { challengeId } = useChallenge();

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
          challengeId,
          mountainId: undefined,
          limit: undefined,
        }),
      });
    },
  });
};

export const useUpdateSummitMutation = () => {
  const { challengeId } = useChallenge();

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
          challengeId,
          mountainId: undefined,
          limit: undefined,
        }),
      });
    },
  });
};
