import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { challengeKeys } from "@/lib/query-keys";

export const useActiveChallenge = () => {
  return useQuery({
    queryKey: challengeKeys.active(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/challenge/active"
      );
      if (error) throw error;
      return data?.message;
    },
  });
};

export const useChallengesGet = () => {
  return useQuery({
    queryKey: challengeKeys.list(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/challenge/all");
      if (error) throw error;
      return data?.message;
    },
  });
};

export const useChallengeDetail = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: challengeKeys.detail(id),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/challenge/detail",
        { params: { query: { id } } }
      );
      if (error) throw error;
      return data?.message;
    },
  });
};
