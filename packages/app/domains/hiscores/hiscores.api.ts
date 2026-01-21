import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { hiscoresKeys } from "@/lib/query-keys";

export const useHiscoresGet = () => {
  return useQuery({
    queryKey: hiscoresKeys.list(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/hiscores/all", {
        params: { query: {} },
      });
      if (error) throw error;
      return data?.message;
    },
  });
};
