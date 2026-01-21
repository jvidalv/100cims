import { useInfiniteQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { hiscoresKeys } from "@/lib/query-keys";

const PAGE_SIZE = 50;

type HiscoreEntry = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  summitsCount: string;
  uniquePeaksCount: string;
  essentialPeaksCount: string;
  totalScore: number;
};

type PaginatedHiscores = {
  items: HiscoreEntry[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
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
