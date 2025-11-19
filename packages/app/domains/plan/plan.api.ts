import { useMutation, useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import { useUserMe } from "@/domains/user/user.api";
import apiClient from "@/lib/api-client";

export const usePlans = (
  params?: {
    status?: string;
    limit?: number;
    creatorId?: string;
    userId?: string;
    sort?: "upcoming";
    challengeId?: string;
  },
  { enabled }: { enabled?: boolean } = {},
) => {
  const { challengeId } = useChallenge();

  if (params) {
    params.challengeId = challengeId;
  }

  return useQuery({
    queryKey: ["plans", params],
    enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/plans/all", {
        params: { query: params ?? { challengeId } },
      });
      if (error) throw error;
      return data.message;
    },
  });
};

export const usePlanOne = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["plan", id],
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
    queryKey: ["plans", "count-new", user?.id],
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
        queryKey: ["plans", "count-new", user?.id],
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
      mountainIds?: string[];
      challengeId?: string;
      userIds?: string[];
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/create",
        { body: input },
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
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
      userIds?: string[];
      status?: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/update",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({
        queryKey: [
          "plans",
          {
            limit: 3,
            status: "open",
            sort: "upcoming",
          },
        ],
      });
      void queryClient.invalidateQueries({ queryKey: ["plan", variables.id] });
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
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.removeQueries({ queryKey: ["plan", variables.id] });
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
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", planId] });
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
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", planId] });
    },
  });
};
