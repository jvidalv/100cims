import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
import { useUserMe } from "@/domains/user/user.api";
import apiClient from "@/lib/api-client";
import { calendarKeys, planKeys } from "@/lib/query-keys";

import type { paths } from "@/types/api";

const PLANS_PAGE_SIZE = 20;

export type PlanStatus = "open" | "completed" | "canceled";
export type PlanType = "hike" | "trail" | "bike";

// Body shapes for plan-create / plan-update / plan-delete derived from the
// API's OpenAPI schemas so they stay in lockstep with the backend body
// validators — adding/renaming/optional-ising a field on the server
// immediately surfaces it here.
type PlanCreateBody =
  paths["/api/protected/plans/create"]["post"]["requestBody"]["content"]["application/json"];
type PlanUpdateBody =
  paths["/api/protected/plans/update"]["post"]["requestBody"]["content"]["application/json"];
type PlanDeleteBody =
  paths["/api/protected/plans/delete"]["post"]["requestBody"]["content"]["application/json"];

export const usePlans = (
  params?: {
    status?: PlanStatus;
    limit?: number;
    creatorId?: string;
    userId?: string;
    sort?: "upcoming";
  },
  { enabled }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: planKeys.list(params),
    enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/plans/all", {
        params: { query: params ?? {} },
      });
      if (error) throw error;
      return data.message;
    },
  });
};

/**
 * Admin-curated featured open plans. Backs the home "Upcoming plans"
 * section, where featured plans are rendered above the regular upcoming
 * window (and deduped so a featured plan that also falls in the upcoming
 * limit only shows once). Separate from `usePlans` so the existing list
 * surfaces (/plans, mountain detail) keep their stable sort.
 */
export const useFeaturedPlans = (params?: { limit?: number }) =>
  useQuery({
    queryKey: planKeys.featured(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/plans/featured",
        { params: { query: params ?? {} } },
      );
      if (error) throw error;
      return data.message;
    },
  });

export const usePlansInfinite = (params?: {
  status?: PlanStatus;
  creatorId?: string;
  userId?: string;
  sort?: "upcoming";
  challengeId?: string;
}) => {
  return useInfiniteQuery({
    queryKey: planKeys.listInfinite(params),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET(
        "/api/public/plans/all-paginated",
        {
          params: {
            query: { ...(params ?? {}), page: pageParam, limit: PLANS_PAGE_SIZE },
          },
        },
      );
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  });
};

/**
 * Open plans (status === "open") that include the given mountain. Sorted by
 * start date ascending — soonest first. Response is shaped like the calendar
 * plan-event so the existing `PlanItemListCompact` row consumes it as-is.
 */
export const usePlansByMountain = (mountainSlug: string | undefined) => {
  return useQuery({
    queryKey: mountainSlug
      ? planKeys.byMountain(mountainSlug)
      : (["noop"] as const),
    enabled: !!mountainSlug,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/plans/by-mountain",
        { params: { query: { mountainSlug: mountainSlug ?? "" } } },
      );
      if (error) throw error;
      return data.message.events;
    },
  });
};

export const usePlanOne = ({ id }: { id: string | undefined }) => {
  return useQuery({
    queryKey: planKeys.one(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/plans/one", {
        params: { query: { id: id ?? "" } },
      });
      if (error) throw error;
      return data.message;
    },
  });
};

export const useNewPlansCount = () => {
  const { data: user } = useUserMe();

  return useQuery({
    queryKey: planKeys.countNew(user?.id),
    // Skip the request entirely when there's no user — there's no userId
    // to scope the count against, and unauth visitors don't have a badge.
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await apiClient.GET(
        "/api/public/plans/count-new",
        {
          params: { query: { userId: user.id } },
        },
      );
      if (error) throw error;
      return data;
    },
  });
};

export const useMarkPlansAsVisited = () => {
  const { data: user } = useUserMe();

  return useMutation({
    mutationKey: ["plans", "mark-visited"],
    mutationFn: async () => {
      // No-op when there's no signed-in user. Callers should also gate, but
      // an explicit early return avoids the non-null assertion and keeps the
      // mutation safe to call eagerly during tab focus / first-render races.
      if (!user?.id) return null;
      const { data, error } = await apiClient.POST(
        "/api/public/plans/count-new",
        { body: { userId: user.id } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: planKeys.countNew(user?.id),
      });
    },
  });
};

export const usePlanCreate = () => {
  return useMutation({
    mutationKey: ["plan", "create"],
    mutationFn: async (input: PlanCreateBody) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/create",
        { body: input },
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const usePlanUpdate = () => {
  return useMutation({
    mutationKey: ["plan", "update"],
    mutationFn: async (input: PlanUpdateBody) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/update",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      void queryClient.invalidateQueries({ queryKey: planKeys.one(variables.id) });
    },
  });
};

export const usePlanDelete = () => {
  return useMutation({
    mutationKey: ["plan", "delete"],
    mutationFn: async (input: PlanDeleteBody) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/delete",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      void queryClient.removeQueries({ queryKey: planKeys.one(variables.id) });
    },
  });
};

export const usePlanJoin = (planId: string | undefined) => {
  return useMutation({
    mutationKey: ["plan", "join"],
    mutationFn: async () => {
      // The NativeTabs eager-mount window leaves planId briefly undefined
      // — surface that explicitly instead of POSTing { id: undefined } and
      // getting a 422 from TypeBox.
      if (!planId) throw new Error("PLAN_ID_UNRESOLVED");
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/join",
        { body: { id: planId } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      if (planId) {
        void queryClient.invalidateQueries({ queryKey: planKeys.one(planId) });
      }
    },
  });
};

export const usePlanLeave = (planId: string | undefined) => {
  return useMutation({
    mutationKey: ["plan", "leave"],
    mutationFn: async () => {
      if (!planId) throw new Error("PLAN_ID_UNRESOLVED");
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/leave",
        { body: { id: planId } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      if (planId) {
        void queryClient.invalidateQueries({ queryKey: planKeys.one(planId) });
      }
    },
  });
};

export const useAdminDeletePlanMutation = () => {
  return useMutation({
    mutationKey: ["plan", "admin-delete"],
    mutationFn: async ({ planId }: { planId: string }) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/admin/plans/{id}",
        { params: { path: { id: planId } } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { planId }) => {
      void queryClient.invalidateQueries({ queryKey: planKeys.all });
      void queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      void queryClient.removeQueries({ queryKey: planKeys.one(planId) });
    },
  });
};
