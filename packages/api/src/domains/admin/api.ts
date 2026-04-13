import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export const useCrons = () =>
  useQuery({
    queryKey: adminKeys.crons(),
    queryFn: async () => {
      const { data, error } = await api.api.admin.crons.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminUsers = ({
  page,
  q,
  country,
  platform,
  version,
}: {
  page: number;
  q: string;
  country: string;
  platform: string;
  version: string;
}) =>
  useQuery({
    queryKey: adminKeys.users({ page, q, country, platform, version }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.users.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          country: country || undefined,
          platform: platform || undefined,
          version: version || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminUserDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.users({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminUserUpdateBody = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  town?: string | null;
  country?: string | null;
  locale?: string | null;
  visibleOnHiscores?: boolean;
  visibleOnPeopleSearch?: boolean;
  admin?: boolean;
};

export const useUpdateAdminUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminUserUpdateBody) => {
      const { data, error } = await api.api.admin.users({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.userDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.usersList() });
    },
  });
};

export const useAdminUserSummits = (id: string, page: number) =>
  useQuery({
    queryKey: adminKeys.userSummits(id, page),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .users({ id })
        .summits.get({ query: { page, pageSize: 15 } });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminMountains = ({ page, q }: { page: number; q: string }) =>
  useQuery({
    queryKey: adminKeys.mountains({ page, q }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.mountains.get({
        query: { page, pageSize: 15, q: q || undefined },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminMountainDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.mountainDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.mountains({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminMountainChallenges = (id: string) =>
  useQuery({
    queryKey: adminKeys.mountainChallenges(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .mountains({ id })
        .challenges.get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminMountainUpdateBody = {
  name?: string;
  location?: string;
  essential?: boolean;
  height?: string;
  latitude?: string;
  longitude?: string;
  url?: string | null;
  imageUrl?: string | null;
};

export const useUpdateAdminMountain = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminMountainUpdateBody) => {
      const { data, error } = await api.api.admin.mountains({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.mountainDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.mountainsList() });
    },
  });
};

export const useDeleteAdminMountain = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.mountains({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.mountainDetail(id) });
      qc.removeQueries({ queryKey: adminKeys.mountainChallenges(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.mountainsList() });
    },
  });
};

export const useAdminSummits = ({
  page,
  q,
  validated,
}: {
  page: number;
  q: string;
  validated: string;
}) =>
  useQuery({
    queryKey: adminKeys.summits({ page, q, validated }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.summits.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          validated: validated || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminSummitDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.summitDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.summits({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminSummitUpdateBody = {
  summitedAt?: string;
  validated?: boolean;
  imageUrl?: string;
  mountainId?: string | null;
  userId?: string | null;
};

export const useUpdateAdminSummit = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminSummitUpdateBody) => {
      const { data, error } = await api.api.admin.summits({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.summitDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.summitsList() });
    },
  });
};

export const useAdminPlans = ({
  page,
  q,
  status,
  speed,
}: {
  page: number;
  q: string;
  status: string;
  speed: string;
}) =>
  useQuery({
    queryKey: adminKeys.plans({ page, q, status, speed }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.plans.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          status: status || undefined,
          speed: speed || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminPlanDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.planDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.plans({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminPlanUpdateBody = {
  title?: string;
  description?: string | null;
  status?: "open" | "completed" | "canceled";
  speed?: "chill" | "normal" | "fast";
  startDate?: string | null;
  imageUrl?: string | null;
  routeUrl?: string | null;
};

export const useUpdateAdminPlan = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminPlanUpdateBody) => {
      const { data, error } = await api.api.admin.plans({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.planDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.plansList() });
    },
  });
};

export const useDeleteAdminPlan = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.plans({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.planDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.plansList() });
    },
  });
};

export const useRemoveAdminPlanMember = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await api.api.admin
        .plans({ id: planId })
        .members({ userId })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.planDetail(planId) });
    },
  });
};

export const useDeleteAdminSummit = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.summits({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.summitDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.summitsList() });
    },
  });
};

export type StatsMetric = "new-users" | "summits" | "plans";
export type StatsRange = "week" | "month" | "6months" | "year" | "all";

export const useAdminStatsTimeseries = (
  metric: StatsMetric,
  range: StatsRange,
) =>
  useQuery({
    queryKey: adminKeys.statsTimeseries(metric, range),
    queryFn: async () => {
      const { data, error } = await api.api.admin.stats.timeseries.get({
        query: { metric, range },
      });
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminChallenges = ({
  page,
  q,
  kind,
}: {
  page: number;
  q: string;
  kind: string;
}) =>
  useQuery({
    queryKey: adminKeys.challenges({ page, q, kind }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.challenges.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          kind: kind || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
  });

export const useAdminChallengeDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.challengeDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.challenges({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminChallengeMountains = (id: string) =>
  useQuery({
    queryKey: adminKeys.challengeMountains(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .challenges({ id })
        .mountains.get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminChallengeUpdateBody = {
  name?: string;
  country?: string;
  description?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  webUrl?: string | null;
  isPublic?: boolean;
};

export const useUpdateAdminChallenge = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminChallengeUpdateBody) => {
      const { data, error } = await api.api.admin.challenges({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.challengeDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.challengesList() });
    },
  });
};

export const useDeleteAdminChallenge = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.challenges({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.challengeDetail(id) });
      qc.removeQueries({ queryKey: adminKeys.challengeMountains(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.challengesList() });
    },
  });
};

export const useTriggerCron = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await api.api.admin
        .crons({ name })
        .trigger.post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.crons() });
    },
  });
};
