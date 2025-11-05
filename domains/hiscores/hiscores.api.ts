import { useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import apiClient from "@/lib/api-client";

export const useHiscoresGet = () => {
  const { challengeId } = useChallenge();

  return useQuery({
    queryKey: ["hiscores", challengeId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/hiscores/all", {
        params: { query: { challengeId } },
      });
      if (error) throw error;
      return data?.message;
    },
  });
};
