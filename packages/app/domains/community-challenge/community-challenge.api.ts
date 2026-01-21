import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";
import { communityChallengeKeys, mountainKeys } from "@/lib/query-keys";

export const useCommunityChallengesList = (
  params?: { filter?: "mine" | "public" },
  { enabled }: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: communityChallengeKeys.list(params),
    enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/community-challenge/list",
        { params: { query: params ?? {} } }
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export const useCommunityChallengeDetail = (
  { id }: { id: string },
  { enabled }: { enabled?: boolean } = {}
) => {
  return useQuery({
    queryKey: communityChallengeKeys.one(id),
    enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/community-challenge/detail",
        { params: { query: { id } } }
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export type InlineMountain = {
  name: string;
  location: string;
  height: number;
  latitude: number;
  longitude: number;
  essential?: boolean;
  image: string;
};

export const useCommunityChallengeCreate = () => {
  return useMutation({
    mutationKey: ["community-challenge", "create"],
    mutationFn: async (input: {
      name: string;
      country: string;
      description?: string;
      emoji?: string;
      isPublic?: boolean;
      image?: string;
      mountainIds?: string[];
      newMountains?: InlineMountain[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/community-challenge/create",
        { body: input }
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: communityChallengeKeys.all });
      void queryClient.invalidateQueries({ queryKey: mountainKeys.all });
    },
  });
};

export const useCommunityChallengeUpdate = () => {
  return useMutation({
    mutationKey: ["community-challenge", "update"],
    mutationFn: async (input: {
      id: string;
      name?: string;
      country?: string;
      description?: string;
      emoji?: string;
      isPublic?: boolean;
      image?: string;
      mountainIds?: string[];
      newMountains?: InlineMountain[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/community-challenge/update",
        { body: input }
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: communityChallengeKeys.all });
      void queryClient.invalidateQueries({
        queryKey: communityChallengeKeys.one(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: mountainKeys.all });
    },
  });
};

export const useCommunityChallengeDelete = () => {
  return useMutation({
    mutationKey: ["community-challenge", "delete"],
    mutationFn: async (input: { id: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/community-challenge/delete",
        { body: input }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: communityChallengeKeys.all });
      void queryClient.removeQueries({
        queryKey: communityChallengeKeys.one(variables.id),
      });
    },
  });
};

const DEFAULT_PAGE_SIZE = 20;

export const useMountainsSearch = (params: {
  query?: string;
  challengeId?: string;
  pageSize?: number;
}) => {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: mountainKeys.search(params.query ?? "", params.challengeId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET(
        "/api/protected/community-challenge/search-mountains",
        {
          params: {
            query: {
              query: params.query || undefined,
              challengeId: params.challengeId || undefined,
              page: pageParam,
              pageSize,
            },
          },
        }
      );
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};
