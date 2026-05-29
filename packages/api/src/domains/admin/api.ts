import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Static } from "elysia";

import type {
  AdminCouponCreateBodySchema,
  AdminCouponRedeemBodySchema,
  AdminCouponUpdateBodySchema,
  AdminMerchCreateBodySchema,
  AdminMerchUpdateBodySchema,
  AdminPlanCreateBodySchema,
  AdminPlanUpdateBodySchema,
  AdminShopRequestUpdateBodySchema,
} from "@/api/schemas/admin.schema";
import type { PlanMemberRole } from "@/db/enums";
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

export const useAdminUsers = (
  {
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
  },
  options?: { enabled?: boolean },
) =>
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
    enabled: options?.enabled ?? true,
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

export const useAdminUserSaved = (id: string) =>
  useQuery({
    queryKey: adminKeys.userSaved(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.users({ id }).saved.get();
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

export const useAdminMountains = (
  {
    page,
    q,
    sort,
  }: {
    page: number;
    q: string;
    sort: string;
  },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: adminKeys.mountains({ page, q, sort }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.mountains.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
          sort: sort || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
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

export const useAdminCommentsList = ({
  page,
  q,
  sort,
}: {
  page: number;
  q: string;
  sort: string;
}) =>
  useQuery({
    queryKey: adminKeys.comments({ page, q, sort }),
    queryFn: async () => {
      const { data, error } = await api.api.admin["mountain-comments"].get({
        query: {
          page,
          pageSize: 25,
          q: q || undefined,
          sort: sort || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
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

export const useAdminMountainRatings = (id: string) =>
  useQuery({
    queryKey: adminKeys.mountainRatings(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .mountains({ id })
        .ratings.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useDeleteAdminMountainRating = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ratingId: string) => {
      const { data, error } = await api.api.admin["mountain-ratings"]({
        id: ratingId,
      }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainRatings(mountainId),
      });
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainDetail(mountainId),
      });
      void qc.invalidateQueries({ queryKey: adminKeys.mountainsList() });
    },
  });
};

export const useAdminMountainComments = (id: string) =>
  useQuery({
    queryKey: adminKeys.mountainComments(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .mountains({ id })
        .comments.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useCreateAdminMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string; parentCommentId?: string }) => {
      const { data, error } = await api.api.admin[
        "mountain-comments"
      ].create.post({
        mountainId,
        body: input.body,
        parentCommentId: input.parentCommentId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainComments(mountainId),
      });
    },
  });
};

export const useUpdateAdminMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; body: string }) => {
      const { data, error } =
        await api.api.admin["mountain-comments"].update.post(input);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainComments(mountainId),
      });
      void qc.invalidateQueries({ queryKey: adminKeys.commentsList() });
      void qc.invalidateQueries({
        queryKey: adminKeys.commentDetail(variables.id),
      });
    },
  });
};

export const useUpvoteAdminMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await api.api.admin[
        "mountain-comments"
      ].upvote.post({ commentId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainComments(mountainId),
      });
    },
  });
};

export const useDeleteAdminMountainComment = (mountainId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await api.api.admin["mountain-comments"]({
        id: commentId,
      }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, commentId) => {
      void qc.invalidateQueries({
        queryKey: adminKeys.mountainComments(mountainId),
      });
      void qc.invalidateQueries({ queryKey: adminKeys.commentsList() });
      void qc.invalidateQueries({
        queryKey: adminKeys.commentDetail(commentId),
      });
    },
  });
};

/**
 * Hooks for the cross-mountain admin Comments page. Same wire endpoints as
 * `useUpdate/DeleteAdminMountainComment`, but routed for callers that don't
 * have the mountain id in scope (the /admin/comments[/id] pages); invalidate
 * the cross-mountain list + detail keys rather than a specific mountain.
 */
export const useAdminCommentDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.commentDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin["mountain-comments"]({
        id,
      }).get();
      if (error) throw error;
      return data.message;
    },
  });

export const useUpdateAdminComment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { body: string }) => {
      const { data, error } = await api.api.admin[
        "mountain-comments"
      ].update.post({ id, body: input.body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.commentDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.commentsList() });
    },
  });
};

export const useDeleteAdminComment = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin["mountain-comments"]({
        id,
      }).delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.commentsList() });
      void qc.removeQueries({ queryKey: adminKeys.commentDetail(id) });
    },
  });
};

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

export const useAdminPlanMemberLog = (id: string) =>
  useQuery({
    queryKey: adminKeys.planMemberLog(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin
        .plans({ id })
        ["member-log"].get();
      if (error) throw error;
      return data.message.items;
    },
  });

export type AdminPlanUpdateBody = Static<typeof AdminPlanUpdateBodySchema>;

export type AdminPlanCreateBody = Static<typeof AdminPlanCreateBodySchema>;

export const useCreateAdminPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminPlanCreateBody) => {
      const { data, error } = await api.api.admin.plans.post(body);
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.plansList() });
    },
  });
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
      void qc.invalidateQueries({ queryKey: adminKeys.planMemberLog(planId) });
    },
  });
};

export const useAddAdminPlanMountain = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mountainId: string) => {
      const { data, error } = await api.api.admin
        .plans({ id: planId })
        .mountains({ mountainId })
        .post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.planDetail(planId) });
      void qc.invalidateQueries({ queryKey: adminKeys.plansList() });
    },
  });
};

export const useRemoveAdminPlanMountain = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mountainId: string) => {
      const { data, error } = await api.api.admin
        .plans({ id: planId })
        .mountains({ mountainId })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.planDetail(planId) });
      void qc.invalidateQueries({ queryKey: adminKeys.plansList() });
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

export const useAdminChallenges = (
  {
    page,
    q,
    kind,
  }: {
    page: number;
    q: string;
    kind: string;
  },
  options?: { enabled?: boolean },
) =>
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
    enabled: options?.enabled ?? true,
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

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export const useAdminOrganizations = (
  { page, q }: { page: number; q: string },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: adminKeys.organizations({ page, q }),
    queryFn: async () => {
      const { data, error } = await api.api.admin.organizations.get({
        query: {
          page,
          pageSize: 15,
          q: q || undefined,
        },
      });
      if (error) throw error;
      return data.message;
    },
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });

export const useAdminOrganizationDetail = (id: string) =>
  useQuery({
    queryKey: adminKeys.organizationDetail(id),
    queryFn: async () => {
      const { data, error } = await api.api.admin.organizations({ id }).get();
      if (error) throw error;
      return data.message;
    },
  });

export type AdminOrganizationCreateBody = {
  name: string;
  description?: string;
  websiteUrl?: string;
  imageUrl?: string;
};

export const useCreateAdminOrganization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminOrganizationCreateBody) => {
      const { data, error } = await api.api.admin.organizations.post(body);
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizationsList() });
    },
  });
};

export type AdminOrganizationUpdateBody = {
  name?: string;
  description?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
};

export const useUpdateAdminOrganization = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AdminOrganizationUpdateBody) => {
      const { data, error } = await api.api.admin
        .organizations({ id })
        .post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.organizationDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.organizationsList() });
    },
  });
};

export const useDeleteAdminOrganization = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.api.admin
        .organizations({ id })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: adminKeys.organizationDetail(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.organizationsList() });
    },
  });
};

export const useAddAdminOrganizationMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { userId: string }) => {
      const { data, error } = await api.api.admin
        .organizations({ id: orgId })
        .members.post(body);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminKeys.organizationDetail(orgId),
      });
      void qc.invalidateQueries({ queryKey: adminKeys.organizationsList() });
    },
  });
};

export const useRemoveAdminOrganizationMember = (orgId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await api.api.admin
        .organizations({ id: orgId })
        .members({ userId })
        .delete();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminKeys.organizationDetail(orgId),
      });
      void qc.invalidateQueries({ queryKey: adminKeys.organizationsList() });
    },
  });
};

// Promote/demote a participant inside a plan. Mirrors the (now-deleted)
// org-side role hook but targets plan_has_users.role instead.
export const useUpdateAdminPlanMemberRole = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { userId: string; role: PlanMemberRole }) => {
      const { data, error } = await api.api.admin
        .plans({ id: planId })
        .members({ userId: args.userId })
        .role.patch({ role: args.role });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.planDetail(planId) });
    },
  });
};
