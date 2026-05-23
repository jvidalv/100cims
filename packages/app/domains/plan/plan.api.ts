import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
import { useUserMe } from "@/domains/user/user.api";
import apiClient from "@/lib/api-client";
import { calendarKeys, planKeys } from "@/lib/query-keys";

const PLANS_PAGE_SIZE = 20;

export type PlanStatus = "open" | "completed" | "canceled";
export type PlanType = "hike" | "trail" | "bike";

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

export const usePlanOne = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: planKeys.one(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/plans/one", {
        params: { query: { id } },
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
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/plans/count-new",
        {
          params: { query: user?.id ? { userId: user.id } : {} },
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
      const { data, error } = await apiClient.POST(
        "/api/public/plans/count-new",
        { body: { userId: user!.id } },
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
    mutationFn: async (input: {
      title: string;
      description: string;
      startDate?: string;
      startTime?: string;
      type?: PlanType;
      mountainIds?: string[];
      userIds?: string[];
      isPrivate?: boolean;
    }) => {
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
    mutationFn: async (input: {
      id: string;
      title?: string;
      description?: string;
      mountainIds?: string[];
      startDate?: string;
      startTime?: string | null;
      type?: PlanType | null;
      userIds?: string[];
      status?: PlanStatus;
      isPrivate?: boolean;
    }) => {
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
    mutationFn: async (input: { id: string }) => {
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

export const usePlanJoin = (planId: string) => {
  return useMutation({
    mutationKey: ["plan", "join"],
    mutationFn: async () => {
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
      void queryClient.invalidateQueries({ queryKey: planKeys.one(planId) });
    },
  });
};

export const usePlanLeave = (planId: string) => {
  return useMutation({
    mutationKey: ["plan", "leave"],
    mutationFn: async () => {
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
      void queryClient.invalidateQueries({ queryKey: planKeys.one(planId) });
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
