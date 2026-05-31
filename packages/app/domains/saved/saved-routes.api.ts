import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";
import { userKeys } from "@/lib/query-keys";

import type { paths } from "@/types/api";

// Derived from the API's OpenAPI schema so the saved-route row shape stays
// in lockstep with `SavedRouteSchema` in the backend without a hand-mirrored
// type. Adding a field on the server immediately surfaces it here.
export type SavedRoute =
  paths["/api/protected/user/saved-routes"]["get"]["responses"][200]["content"]["application/json"]["message"][number];

export const useSavedRoutesGet = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: userKeys.savedRoutes(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/saved-routes",
        {},
      );
      if (error) throw error;
      return data.message;
    },
  });
};

type MutateContext = { previous?: SavedRoute[] };

export const useSavedRouteAddMutation = () => {
  return useMutation({
    mutationKey: ["user", "saved-routes", "add"],
    mutationFn: async ({ routeId }: { routeId: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/saved-routes",
        { body: { routeId } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: userKeys.savedRoutes() });
      const previous = queryClient.getQueryData<SavedRoute[]>(
        userKeys.savedRoutes(),
      );
      // No optimistic insert — we don't have the route's denormalised join
      // payload (title, distance, mountain) at this call site. The server
      // returns the canonical row on refetch.
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.savedRoutes(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.savedRoutes() });
    },
  });
};

export const useSavedRouteRemoveMutation = () => {
  return useMutation({
    mutationKey: ["user", "saved-routes", "remove"],
    mutationFn: async ({ routeId }: { routeId: string }) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/user/saved-routes/{routeId}",
        { params: { path: { routeId } } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ routeId }): Promise<MutateContext> => {
      await queryClient.cancelQueries({ queryKey: userKeys.savedRoutes() });
      const previous = queryClient.getQueryData<SavedRoute[]>(
        userKeys.savedRoutes(),
      );
      if (previous) {
        queryClient.setQueryData<SavedRoute[]>(
          userKeys.savedRoutes(),
          previous.filter((r) => r.routeId !== routeId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.savedRoutes(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.savedRoutes() });
    },
  });
};

export const useIsRouteSaved = (routeId: string | undefined) => {
  const { data } = useSavedRoutesGet();
  if (!routeId || !data) return false;
  return data.some((r) => r.routeId === routeId);
};
