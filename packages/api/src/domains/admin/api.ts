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
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
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

export const useAdminMountains = ({
  page,
  q,
}: {
  page: number;
  q: string;
}) =>
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
      const { data, error } = await api.api.admin
        .mountains({ id })
        .post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.mountainDetail(id) });
      void qc.invalidateQueries({ queryKey: ["admin", "mountains"] });
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
      void qc.invalidateQueries({ queryKey: ["admin", "mountains"] });
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
