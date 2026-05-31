import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";
import { userKeys } from "@/lib/query-keys";

import type { paths } from "@/types/api";

// Derived from the API's OpenAPI schema so the saved-mountain row shape
// stays in lockstep with `SavedMountainSchema` in the backend.
export type SavedMountain =
  paths["/api/protected/user/saved"]["get"]["responses"][200]["content"]["application/json"]["message"][number];

export const useSavedGet = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userKeys.saved(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/saved",
        {},
      );
      if (error) throw error;
      return data.message;
    },
  });
};

type MutateContext = { previous?: SavedMountain[] };

export const useSavedAddMutation = () => {
  return useMutation({
    mutationKey: ["user", "saved", "add"],
    mutationFn: async ({ mountainId }: { mountainId: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/saved",
        { body: { mountainId } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: userKeys.saved() });
      const previous = queryClient.getQueryData<SavedMountain[]>(
        userKeys.saved(),
      );
      // We don't have the mountain detail here; the UI derives `isSaved` from
      // the query result. The server will return the canonical row on refetch.
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.saved(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.saved() });
    },
  });
};

export const useSavedRemoveMutation = () => {
  return useMutation({
    mutationKey: ["user", "saved", "remove"],
    mutationFn: async ({ mountainId }: { mountainId: string }) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/user/saved/{mountainId}",
        { params: { path: { mountainId } } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ mountainId }): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: userKeys.saved() });
      const previous = queryClient.getQueryData<SavedMountain[]>(
        userKeys.saved(),
      );
      if (previous) {
        queryClient.setQueryData<SavedMountain[]>(
          userKeys.saved(),
          previous.filter((m) => m.mountainId !== mountainId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.saved(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.saved() });
    },
  });
};

export const useIsMountainSaved = (mountainId: string | undefined) => {
  const { data } = useSavedGet();
  if (!mountainId || !data) return false;
  return data.some((m) => m.mountainId === mountainId);
};
