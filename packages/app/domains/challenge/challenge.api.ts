import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
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

/**
 * Viewer's per-challenge progress (mountains + essentials summited vs total).
 * Authenticated route — pass `enabled: false` when the user isn't logged in,
 * the "Your stats" section then renders nothing.
 */
export const useChallengeMyProgress = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: challengeKeys.myProgress(id),
    enabled: !!id && enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/challenge/my-progress",
        { params: { query: { id } } },
      );
      if (error) throw error;
      return data?.message;
    },
  });
};

export const useAdminDeleteChallengeMutation = () => {
  return useMutation({
    mutationKey: ["challenge", "admin-delete"],
    mutationFn: async ({ challengeId }: { challengeId: string }) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/admin/challenges/{id}",
        { params: { path: { id: challengeId } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { challengeId }) => {
      void queryClient.invalidateQueries({ queryKey: challengeKeys.list() });
      void queryClient.removeQueries({
        queryKey: challengeKeys.detail(challengeId),
      });
    },
  });
};
