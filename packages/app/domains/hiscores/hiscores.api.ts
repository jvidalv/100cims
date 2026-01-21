import { useInfiniteQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { hiscoresKeys } from "@/lib/query-keys";

const PAGE_SIZE = 50;

export const useHiscoresGet = () => {
  return useInfiniteQuery({
    queryKey: hiscoresKeys.list(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET("/api/public/hiscores/all", {
        params: { query: { page: pageParam, limit: PAGE_SIZE } },
      });
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};
