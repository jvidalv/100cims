import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { updateKeys } from "@/lib/query-keys";

export const useUnseenUpdates = (updateIds: string[]) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: updateKeys.unseen(updateIds),
    enabled: isAuthenticated && updateIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/unseen-updates",
        {
          params: { query: { updateIds: updateIds.join(",") } },
        },
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export const useMarkUpdateSeen = () => {
  return useMutation({
    mutationKey: ["update", "mark-seen"],
    mutationFn: async (updateId: string) => {
      const { error } = await apiClient.POST(
        "/api/protected/user/mark-update-seen",
        {
          body: { updateId },
        },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: updateKeys.all });
    },
  });
};
