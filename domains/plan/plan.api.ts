import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "@/components/providers/query-client-provider";
import { useUserMe } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { api } from "@/lib";

export const usePlans = (
  params?: {
    status?: string;
    limit?: number;
    creatorId?: string;
    userId?: string;
    sort?: "upcoming";
  },
  { enabled }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: ["plans", params],
    enabled,
    queryFn: () => api.public.plans.all.get({ query: params ?? {} }),
  });
};

export const usePlanOne = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["plan", id],
    queryFn: () => api.public.plans.one.get({ query: { id } }),
  });
};

export const useNewPlansCount = () => {
  const { data: user } = useUserMe();

  return useQuery({
    queryKey: ["plans", "count-new", user?.id],
    queryFn: () =>
      api.public.plans["count-new"].get({
        query: user?.id ? { userId: user.id } : {},
      }),
  });
};

export const useMarkPlansAsVisited = () => {
  const { data: user } = useUserMe();

  return useMutation({
    mutationKey: ["plans", "mark-visited"],
    mutationFn: () => api.public.plans["count-new"].post({ userId: user!.id }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["plans", "count-new", user?.id],
      });
    },
  });
};

export const usePlanCreate = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan", "create"],
    mutationFn: apiWithAuth.protected.plans.create.post,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};

export const usePlanUpdate = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan", "update"],
    mutationFn: apiWithAuth.protected.plans.update.post,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", variables.id] });
    },
  });
};

export const usePlanDelete = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan", "delete"],
    mutationFn: apiWithAuth.protected.plans.delete.post,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.removeQueries({ queryKey: ["plan", variables.id] });
    },
  });
};

export const usePlanJoin = (planId: string) => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan", "join"],
    mutationFn: () => apiWithAuth.protected.plans.join.post({ id: planId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", planId] });
    },
  });
};

export const usePlanLeave = (planId: string) => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan", "leave"],
    mutationFn: () => apiWithAuth.protected.plans.leave.post({ id: planId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["plans"] });
      void queryClient.invalidateQueries({ queryKey: ["plan", planId] });
    },
  });
};
