import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { hiscoresKeys } from "@/lib/query-keys";

const PAGE_SIZE = 50;

export type HiscoreEntry = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  summitsCount: string;
  uniquePeaksCount: string;
  essentialPeaksCount: string;
  totalScore: number;
};

export type RankedHiscoreEntry = HiscoreEntry & { rank: number };

type PaginatedHiscores = {
  items: HiscoreEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    myRank?: number | null;
  };
};

type AroundMeResponse = {
  myRank: number | null;
  totalRanked: number;
  items: RankedHiscoreEntry[];
};

export const useHiscoresGet = () => {
  return useInfiniteQuery({
    queryKey: hiscoresKeys.list(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET("/api/public/hiscores/all", {
        params: { query: { page: pageParam, limit: PAGE_SIZE } },
      });
      if (error) throw error;
      // New app always passes page param, so response is always paginated
      return data.message as PaginatedHiscores;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};

export const useHiscoresAroundMeGet = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: hiscoresKeys.aroundMe(),
    enabled: isAuthenticated,
    queryFn: async (): Promise<AroundMeResponse> => {
      const { data, error } = await apiClient.GET(
        "/api/public/hiscores/around-me",
        {},
      );
      if (error) throw error;
      return data.message;
    },
  });
};
