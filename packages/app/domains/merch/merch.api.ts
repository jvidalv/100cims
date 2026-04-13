import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { merchKeys } from "@/lib/query-keys";

export const useMerch = () =>
  useQuery({
    queryKey: merchKeys.list(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/merch/", {});
      if (error) throw error;
      return data.message;
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
