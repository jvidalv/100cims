import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";

export const DEFAULT_CHALLENGE_ID = "5f996363-7460-4bc8-817c-8dd633c0b504"; // 100cims

export const useChallengesGet = () => {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/challenge/all");
      if (error) throw error;
      return data?.message;
    },
  });
};
