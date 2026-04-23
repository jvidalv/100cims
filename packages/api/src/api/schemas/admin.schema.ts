import { t } from "elysia";

import {
  CouponDiscountTypeSchema,
  PlanSpeedSchema,
  PlanStatusSchema,
  ShopRequestStatusSchema,
} from "@/api/schemas/enums";
import { UnlockablesArraySchema } from "@/api/schemas/unlockables";

export const AdminUserEntrySchema = t.Object({
  id: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  username: t.String(),
  email: t.String(),
  imageUrl: t.Nullable(t.String()),
  country: t.Nullable(t.String()),
  platform: t.Nullable(t.String()),
  appVersion: t.Nullable(t.String()),
  createdAt: t.Date(),
  admin: t.Boolean(),
  activeChallengeId: t.Nullable(t.String()),
  activeChallengeName: t.Nullable(t.String()),
  hasPushToken: t.Boolean(),
  totalSummits: t.Number(),
  lastSummitAt: t.Nullable(t.Date()),
});

export const AdminUsersResponseSchema = t.Object({
  items: t.Array(AdminUserEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  facets: t.Object({
    countries: t.Array(t.String()),
    platforms: t.Array(t.String()),
    versions: t.Array(t.String()),
  }),
});

export const AdminUserDetailSchema = t.Object({
  id: t.String(),
  email: t.String(),
  username: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  town: t.Nullable(t.String()),
  phoneNumber: t.Nullable(t.String()),
  country: t.Nullable(t.String()),
  platform: t.Nullable(t.String()),
  appVersion: t.Nullable(t.String()),
  lastLatitude: t.Nullable(t.String()),
  lastLongitude: t.Nullable(t.String()),
  lastLocationAt: t.Nullable(t.Date()),
  locale: t.Nullable(t.String()),
  visibleOnHiscores: t.Boolean(),
  visibleOnPeopleSearch: t.Boolean(),
  admin: t.Boolean(),
  activeChallengeId: t.Nullable(t.String()),
  activeChallengeName: t.Nullable(t.String()),
  pushNotificationsEnabled: t.Boolean(),
  expoPushToken: t.Nullable(t.String()),
  unlockables: t.Array(t.String()),
  createdAt: t.Date(),
});

export const AdminUserUpdateBodySchema = t.Object({
  firstName: t.Optional(t.Nullable(t.String())),
  lastName: t.Optional(t.Nullable(t.String())),
  username: t.Optional(t.String()),
  town: t.Optional(t.Nullable(t.String())),
  phoneNumber: t.Optional(t.Nullable(t.String())),
  country: t.Optional(t.Nullable(t.String())),
  locale: t.Optional(t.Nullable(t.String())),
  visibleOnHiscores: t.Optional(t.Boolean()),
  visibleOnPeopleSearch: t.Optional(t.Boolean()),
  emailNotificationsEnabled: t.Optional(t.Boolean()),
  admin: t.Optional(t.Boolean()),
  unlockables: t.Optional(UnlockablesArraySchema),
});

export const AdminSummitEntrySchema = t.Object({
  summitId: t.String(),
  summitedAt: t.String(),
  validated: t.Boolean(),
  imageUrl: t.String(),
  mountainId: t.String(),
  mountainName: t.String(),
  mountainSlug: t.String(),
  mountainHeight: t.String(),
  mountainEssential: t.Boolean(),
});

export const AdminSummitsResponseSchema = t.Object({
  items: t.Array(AdminSummitEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

const summitMainUserFields = {
  userId: t.Nullable(t.String()),
  userUsername: t.Nullable(t.String()),
  userFirstName: t.Nullable(t.String()),
  userLastName: t.Nullable(t.String()),
  userImageUrl: t.Nullable(t.String()),
};

const summitMountainFields = {
  mountainId: t.Nullable(t.String()),
  mountainName: t.Nullable(t.String()),
  mountainSlug: t.Nullable(t.String()),
};

const summitCoreFields = {
  id: t.String(),
  imageUrl: t.String(),
  summitedAt: t.String(),
  validated: t.Boolean(),
  createdAt: t.Date(),
};

export const AdminSummitRelatedUserSchema = t.Object({
  id: t.String(),
  username: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  isMain: t.Boolean(),
});

export const AdminSummitListEntrySchema = t.Object({
  ...summitCoreFields,
  ...summitMountainFields,
  ...summitMainUserFields,
  relatedUsersCount: t.Number(),
});

export const AdminSummitListResponseSchema = t.Object({
  items: t.Array(AdminSummitListEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
});

export const AdminSummitDetailSchema = t.Object({
  ...summitCoreFields,
  ...summitMountainFields,
  mountainHeight: t.Nullable(t.String()),
  ...summitMainUserFields,
  relatedUsers: t.Array(AdminSummitRelatedUserSchema),
});

export const AdminStatsTimeseriesResponseSchema = t.Object({
  bucket: t.Union([t.Literal("day"), t.Literal("week"), t.Literal("month")]),
  points: t.Array(
    t.Object({
      date: t.String(),
      count: t.Number(),
    }),
  ),
});

export const AdminSummitUpdateBodySchema = t.Object({
  summitedAt: t.Optional(t.String()),
  validated: t.Optional(t.Boolean()),
  imageUrl: t.Optional(t.String()),
  mountainId: t.Optional(t.Nullable(t.String())),
  userId: t.Optional(t.Nullable(t.String())),
});

export const AdminPlanEntrySchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  speed: t.String(),
  status: PlanStatusSchema,
  isPrivate: t.Boolean(),
  createdAt: t.Date(),
  creatorId: t.String(),
  creatorUsername: t.Nullable(t.String()),
  creatorFirstName: t.Nullable(t.String()),
  creatorLastName: t.Nullable(t.String()),
  creatorImageUrl: t.Nullable(t.String()),
  challengeId: t.Nullable(t.String()),
  challengeName: t.Nullable(t.String()),
  participantsCount: t.Number(),
  mountainsCount: t.Number(),
});

export const AdminPlansResponseSchema = t.Object({
  items: t.Array(AdminPlanEntrySchema),
  page: t.Number(),
  pageSize: t.Number(),
  total: t.Number(),
  totalPages: t.Number(),
  facets: t.Object({
    statuses: t.Array(t.String()),
    speeds: t.Array(t.String()),
  }),
});

export const AdminPlanParticipantSchema = t.Object({
  userId: t.String(),
  username: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  joinedAt: t.Date(),
  willBringDogs: t.Boolean(),
  isCreator: t.Boolean(),
});

export const AdminPlanMountainSchema = t.Object({
  mountainId: t.String(),
  name: t.String(),
  slug: t.String(),
  height: t.String(),
  essential: t.Boolean(),
});

export const AdminPlanMessageSchema = t.Object({
  id: t.String(),
  message: t.String(),
  createdAt: t.Date(),
  userId: t.String(),
  username: t.Nullable(t.String()),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
});

export const AdminPlanDetailSchema = t.Object({
  id: t.String(),
  title: t.String(),
  description: t.Nullable(t.String()),
  imageUrl: t.Nullable(t.String()),
  routeUrl: t.Nullable(t.String()),
  startDate: t.Nullable(t.String()),
  speed: t.String(),
  status: PlanStatusSchema,
  isPrivate: t.Boolean(),
  creatorId: t.String(),
  challengeId: t.Nullable(t.String()),
  challengeName: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  creator: t.Object({
    id: t.String(),
    username: t.Nullable(t.String()),
    firstName: t.Nullable(t.String()),
    lastName: t.Nullable(t.String()),
    imageUrl: t.Nullable(t.String()),
  }),
  participants: t.Array(AdminPlanParticipantSchema),
  mountains: t.Array(AdminPlanMountainSchema),
  recentMessages: t.Array(AdminPlanMessageSchema),
});

export const AdminPlanUpdateBodySchema = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.Nullable(t.String())),
  status: t.Optional(PlanStatusSchema),
  speed: t.Optional(PlanSpeedSchema),
  startDate: t.Optional(t.Nullable(t.String())),
  imageUrl: t.Optional(t.Nullable(t.String())),
  routeUrl: t.Optional(t.Nullable(t.String())),
  isPrivate: t.Optional(t.Boolean()),
});

export const MerchVariantSchema = t.Object({
  color: t.String(),
  imageUrls: t.Array(t.String()),
});

export const MerchEntrySchema = t.Object({
  id: t.String(),
  slug: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  shopUrl: t.Nullable(t.String()),
  imageUrls: t.Array(t.String()),
  hasSize: t.Boolean(),
  sizes: t.Array(t.String()),
  price: t.Number(),
  discountedPrice: t.Nullable(t.Number()),
  featured: t.Nullable(t.Number()),
  createdAt: t.Date(),
  variants: t.Array(MerchVariantSchema),
});

export const AdminMerchEntrySchema = t.Object({
  id: t.String(),
  slug: t.String(),
  nameEn: t.String(),
  nameCa: t.Nullable(t.String()),
  nameEs: t.Nullable(t.String()),
  descriptionEn: t.Nullable(t.String()),
  descriptionCa: t.Nullable(t.String()),
  descriptionEs: t.Nullable(t.String()),
  shopUrl: t.Nullable(t.String()),
  imageUrls: t.Array(t.String()),
  hasSize: t.Boolean(),
  sizes: t.Array(t.String()),
  price: t.Number(),
  discountedPrice: t.Nullable(t.Number()),
  featured: t.Nullable(t.Number()),
  active: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  variants: t.Array(MerchVariantSchema),
});

export const AdminMerchListResponseSchema = t.Object({
  items: t.Array(AdminMerchEntrySchema),
});

export const AdminMerchCreateBodySchema = t.Object({
  slug: t.String({ minLength: 1 }),
  nameEn: t.String({ minLength: 1 }),
  nameCa: t.Optional(t.Nullable(t.String())),
  nameEs: t.Optional(t.Nullable(t.String())),
  descriptionEn: t.Optional(t.Nullable(t.String())),
  descriptionCa: t.Optional(t.Nullable(t.String())),
  descriptionEs: t.Optional(t.Nullable(t.String())),
  shopUrl: t.Optional(t.Nullable(t.String())),
  price: t.Number({ minimum: 0 }),
  discountedPrice: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
  imageUrls: t.Optional(t.Array(t.String())),
  hasSize: t.Optional(t.Boolean()),
  sizes: t.Optional(t.Array(t.String())),
  featured: t.Optional(t.Nullable(t.Number({ minimum: 1, maximum: 5 }))),
  active: t.Optional(t.Boolean()),
  variants: t.Optional(t.Array(MerchVariantSchema)),
});

export const AdminMerchUpdateBodySchema = t.Object({
  slug: t.Optional(t.String({ minLength: 1 })),
  nameEn: t.Optional(t.String({ minLength: 1 })),
  nameCa: t.Optional(t.Nullable(t.String())),
  nameEs: t.Optional(t.Nullable(t.String())),
  descriptionEn: t.Optional(t.Nullable(t.String())),
  descriptionCa: t.Optional(t.Nullable(t.String())),
  descriptionEs: t.Optional(t.Nullable(t.String())),
  shopUrl: t.Optional(t.Nullable(t.String())),
  price: t.Optional(t.Number({ minimum: 0 })),
  discountedPrice: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
  imageUrls: t.Optional(t.Array(t.String())),
  hasSize: t.Optional(t.Boolean()),
  sizes: t.Optional(t.Array(t.String())),
  featured: t.Optional(t.Nullable(t.Number({ minimum: 1, maximum: 5 }))),
  active: t.Optional(t.Boolean()),
  variants: t.Optional(t.Array(MerchVariantSchema)),
});

export const AdminCouponEntrySchema = t.Object({
  id: t.String(),
  code: t.String(),
  discountType: CouponDiscountTypeSchema,
  discountValue: t.Number(),
  maxUses: t.Nullable(t.Number()),
  onePerUser: t.Boolean(),
  active: t.Boolean(),
  redemptionCount: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const AdminCouponListResponseSchema = t.Object({
  items: t.Array(AdminCouponEntrySchema),
});

export const AdminCouponRedemptionEntrySchema = t.Object({
  id: t.String(),
  userId: t.String(),
  userEmail: t.Nullable(t.String()),
  userFirstName: t.Nullable(t.String()),
  userLastName: t.Nullable(t.String()),
  note: t.Nullable(t.String()),
  redeemedAt: t.Date(),
});

export const AdminCouponDetailSchema = t.Intersect([
  AdminCouponEntrySchema,
  t.Object({
    redemptions: t.Array(AdminCouponRedemptionEntrySchema),
  }),
]);

export const AdminCouponCreateBodySchema = t.Object({
  code: t.String({ minLength: 2, maxLength: 40 }),
  discountType: CouponDiscountTypeSchema,
  discountValue: t.Number({ minimum: 1 }),
  maxUses: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  onePerUser: t.Optional(t.Boolean()),
  active: t.Optional(t.Boolean()),
});

export const AdminCouponUpdateBodySchema = t.Object({
  code: t.Optional(t.String({ minLength: 2, maxLength: 40 })),
  discountType: t.Optional(CouponDiscountTypeSchema),
  discountValue: t.Optional(t.Number({ minimum: 1 })),
  maxUses: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
  onePerUser: t.Optional(t.Boolean()),
  active: t.Optional(t.Boolean()),
});

export const AdminCouponRedeemBodySchema = t.Object({
  userId: t.String({ format: "uuid" }),
  note: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
});

export const AdminShopRequestEntrySchema = t.Object({
  id: t.String(),
  userId: t.Nullable(t.String()),
  userEmail: t.String(),
  message: t.String(),
  status: ShopRequestStatusSchema,
  comments: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const AdminShopRequestListResponseSchema = t.Object({
  items: t.Array(AdminShopRequestEntrySchema),
});

export const AdminShopRequestDetailSchema = t.Intersect([
  AdminShopRequestEntrySchema,
  t.Object({
    user: t.Nullable(
      t.Object({
        id: t.String(),
        firstName: t.Nullable(t.String()),
        lastName: t.Nullable(t.String()),
        imageUrl: t.Nullable(t.String()),
      }),
    ),
  }),
]);

export const AdminShopRequestUpdateBodySchema = t.Object({
  status: t.Optional(ShopRequestStatusSchema),
  comments: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
});

export const AdminPersonSchema = t.Object({
  userId: t.String(),
  firstName: t.Nullable(t.String()),
  lastName: t.Nullable(t.String()),
  email: t.String(),
  imageUrl: t.Nullable(t.String()),
  connectedAt: t.Date(),
});

export const AdminSavedMountainSchema = t.Object({
  mountainId: t.String(),
  slug: t.String(),
  name: t.String(),
  location: t.String(),
  height: t.String(),
  essential: t.Boolean(),
  imageUrl: t.Nullable(t.String()),
  savedAt: t.Date(),
});
