import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Static } from "elysia";

import type {
  AdminCouponCreateBodySchema,
  AdminCouponRedeemBodySchema,
  AdminCouponUpdateBodySchema,
  AdminMerchCreateBodySchema,
  AdminMerchUpdateBodySchema,
  AdminShopRequestUpdateBodySchema,
} from "@/api/schemas/admin.schema";
import type { PlanSpeed, PlanStatus } from "@/db/enums";
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
  sort,
}: {
  page: number;
  q: string;
  country: string;
  platform: string;
  version: string;
  sort: string;
}) =>
  useQuery({
    queryKey: adminKeys.users({ page, q, country, platform, version, sort }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.users.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          country: country || undefined,
          platform: platform || undefined,
          version: version || undefined,
          sort: sort || undefined,
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
  phoneNumber?: string | null;
  country?: string | null;
  locale?: string | null;
  visibleOnHiscores?: boolean;
  visibleOnPeopleSearch?: boolean;
  admin?: boolean;
  unlockables?: ("merch" | "share" | "forcat" | "picat")[];
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

export const useAdminUserPeople = (id: string) =>
  useQuery({
    queryKey: adminKeys.userPeople(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.users({ id }).people.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAddAdminUserPerson = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (personUserId: string) => {
      const { data, error } = await api.api.admin
        .users({ id })
        .people.post({ personUserId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.userPeople(id) });
    },
  });
};

export const useRemoveAdminUserPerson = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (personUserId: string) => {
      const { data, error } = await api.api.admin
        .users({ id })
        .people({ personUserId })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.userPeople(id) });
    },
  });
};

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
  status?: PlanStatus;
  speed?: PlanSpeed;
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

export const useAdminMerch = () =>
  useQuery({
    queryKey: adminKeys.merchList(),
    queryFn: async () => {
      const { data, error } = await api.api.admin.merch.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminMerchDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.merchDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.merch({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminMerchCreateBody = Static<typeof AdminMerchCreateBodySchema>;
export type AdminMerchUpdateBody = Static<typeof AdminMerchUpdateBodySchema>;

export const useCreateAdminMerch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminMerchCreateBody) => {
      const { data, error } = await api.api.admin.merch.post(body);
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.merchList() });
    },
  });
};

export const useUpdateAdminMerch = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminMerchUpdateBody) => {
      const { data, error } = await api.api.admin.merch({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.merchDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.merchList() });
    },
  });
};

export const useDeleteAdminMerch = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.merch({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.merchDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.merchList() });
    },
  });
};

export const useAdminCoupons = () =>
  useQuery({
    queryKey: adminKeys.couponList(),
    queryFn: async () => {
      const { data, error } = await api.api.admin.coupon.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminCouponDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.couponDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.coupon({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminCouponCreateBody = Static<typeof AdminCouponCreateBodySchema>;
export type AdminCouponUpdateBody = Static<typeof AdminCouponUpdateBodySchema>;
export type AdminCouponRedeemBody = Static<typeof AdminCouponRedeemBodySchema>;

export const useCreateAdminCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminCouponCreateBody) => {
      const { data, error } = await api.api.admin.coupon.post(body);
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.couponList() });
    },
  });
};

export const useUpdateAdminCoupon = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminCouponUpdateBody) => {
      const { data, error } = await api.api.admin.coupon({ id }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.couponDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.couponList() });
    },
  });
};

export const useDeleteAdminCoupon = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin.coupon({ id }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.couponDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.couponList() });
    },
  });
};

export const useRedeemAdminCoupon = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminCouponRedeemBody) => {
      const { data, error } = await api.api.admin
        .coupon({ id })
        .redeem.post(body);
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.couponDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.couponList() });
    },
  });
};

export type AdminShopRequestUpdateBody = Static<
  typeof AdminShopRequestUpdateBodySchema
>;

export const useAdminShopRequests = () =>
  useQuery({
    queryKey: adminKeys.shopRequestList(),
    queryFn: async () => {
      const { data, error } = await api.api.admin["shop-requests"].get();
      if (error) throw error;
      return data.message;
    },
  });

export const useAdminShopRequestDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.shopRequestDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin["shop-requests"]({
        id,
      }).get();
      if (error) throw error;
      return data.message;
    },
  });

export const useUpdateAdminShopRequest = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminShopRequestUpdateBody) => {
      const { data, error } = await api.api.admin["shop-requests"]({
        id,
      }).post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.shopRequestDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.shopRequestList() });
    },
  });
};

export type AdminEmailTestBody = {
  slug: string;
  locale: "en" | "ca" | "es";
  props?: Record<string, string>;
};

export const useSendTestEmail = () =>
  useMutation({
    mutationFn: async (body: AdminEmailTestBody) => {
      const { data, error } = await api.api.admin.emails.test.post(body);
      if (error) throw error;
      return data;
    },
  });

export type CampaignSlug = "reengage_cold" | "reengage_summer";

export const useCampaignStats = (slug: CampaignSlug) =>
  useQuery({
    queryKey: adminKeys.campaignStats(slug),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .campaigns({ slug })
        .stats.get();
      if (error) throw error;
      return data.message;
    },
    staleTime: 5 * 60_000,
  });

export const useTriggerCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { slug: CampaignSlug; batchSize: number }) => {
      const { data, error } = await api.api.admin
        .campaigns({ slug: args.slug })
        .trigger.post({ batchSize: args.batchSize });
      if (error) throw error;
      return data;
    },
    onSuccess: (_res, args) => {
      void qc.invalidateQueries({
        queryKey: adminKeys.campaignStats(args.slug),
      });
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
