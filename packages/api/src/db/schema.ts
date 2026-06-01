import { relations, sql } from "drizzle-orm";
import {
  uuid,
  boolean,
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  date,
  unique,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

import type {
  CouponDiscountType,
  PlanMemberRole,
  PlanSpeed,
  PlanStatus,
  PlanType,
  PlanUserLogAction,
  ShopRequestStatus,
} from "@/db/enums";

export const challengeTable = pgTable("challenge", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  webUrl: text(),
  country: text().notNull(),
  // Community challenges fields
  creatorId: uuid().references(() => userTable.id, { onDelete: "set null" }),
  description: text(),
  imageUrl: text(),
  emoji: text(),
  isPublic: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
});

export const mountainTable = pgTable("mountain", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  location: text().notNull(),
  essential: boolean().notNull(),
  height: numeric().notNull(),
  latitude: numeric().notNull(),
  longitude: numeric().notNull(),
  utm31tx: numeric(),
  utm31ty: numeric(),
  url: text(),
  imageUrl: text(),
  // Community mountains fields
  creatorId: uuid().references(() => userTable.id, { onDelete: "set null" }),
  createdAt: timestamp().notNull().defaultNow(),
  // Denormalized rating aggregates — kept in sync by the rating write paths
  // (packages/api/src/api/lib/mountain-ratings.ts). Null average means
  // "no ratings on this axis yet". Scale semantics match the per-user columns
  // on mountainRatingTable below: avgFamilyFriendly/avgDogFriendly are
  // "higher = safer" (1 = unsafe, 5 = very safe), avgDifficulty is
  // "higher = harder" (1 = easy, 5 = hard).
  avgFamilyFriendly: real(),
  familyRatingCount: integer().notNull().default(0),
  avgDogFriendly: real(),
  dogRatingCount: integer().notNull().default(0),
  avgDifficulty: real(),
  difficultyRatingCount: integer().notNull().default(0),
});

export const userTable = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  username: text()
    .unique()
    .default(sql`'default_' || random()::text`)
    .notNull(),
  email: text().unique().notNull(),
  firstName: text(),
  lastName: text(),
  imageUrl: text(),
  locale: text(),
  town: text(),
  phoneNumber: text(),
  shippingStreet: text(),
  shippingCity: text(),
  shippingPostalCode: text(),
  shippingCountry: text(),
  visibleOnHiscores: boolean().notNull().default(false),
  visibleOnPeopleSearch: boolean().notNull().default(true),
  admin: boolean().notNull().default(false),
  country: text(),
  platform: text(),
  appVersion: text(),
  lastLatitude: numeric(),
  lastLongitude: numeric(),
  lastLocationAt: timestamp(),
  activeChallengeId: uuid(), // FK constraint in migration to avoid circular reference
  expoPushToken: text(),
  pushNotificationsEnabled: boolean().notNull().default(true),
  emailNotificationsEnabled: boolean().notNull().default(true),
  unlockables: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const summitTable = pgTable(
  "summit",
  {
    id: uuid().primaryKey().defaultRandom(),
    mountainId: uuid().references(() => mountainTable.id, {
      onDelete: "cascade",
    }),
    userId: uuid().references(() => userTable.id, {
      onDelete: "cascade",
    }),
    imageUrl: text().notNull(),
    // Bumped every time imageUrl changes so photo reports reset.
    photoVersion: integer().notNull().default(0),
    validated: boolean().notNull().default(true),
    summitedAt: date().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("summit_user_id_idx").on(table.userId),
    index("summit_mountain_id_idx").on(table.mountainId),
  ],
);

export const mountainRatingTable = pgTable(
  "mountain_rating",
  {
    id: uuid().primaryKey().defaultRandom(),
    mountainId: uuid()
      .notNull()
      .references(() => mountainTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // All three columns are 1–5 integers (enforced by CHECK below) or null
    // if the user didn't rate that axis. Scale direction is NOT uniform:
    //   familyFriendly — 1 = dangerous for children, 5 = very safe
    //   dogFriendly    — 1 = dangerous for dogs,     5 = very safe
    //   difficulty     — 1 = easy (e.g. a 100m stroll),
    //                    5 = hard (e.g. 4k+ peak, technical terrain)
    // Higher is "more of the axis name" — safety for the first two, hardness
    // for difficulty. Don't assume "5 = good" across axes.
    familyFriendly: integer(),
    dogFriendly: integer(),
    difficulty: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("mountain_rating_mountain_user_unique_idx").on(
      table.mountainId,
      table.userId,
    ),
    check(
      "mountain_rating_family_range_check",
      sql`${table.familyFriendly} IS NULL OR (${table.familyFriendly} BETWEEN 1 AND 5)`,
    ),
    check(
      "mountain_rating_dog_range_check",
      sql`${table.dogFriendly} IS NULL OR (${table.dogFriendly} BETWEEN 1 AND 5)`,
    ),
    check(
      "mountain_rating_difficulty_range_check",
      sql`${table.difficulty} IS NULL OR (${table.difficulty} BETWEEN 1 AND 5)`,
    ),
    check(
      "mountain_rating_at_least_one_check",
      sql`${table.familyFriendly} IS NOT NULL OR ${table.dogFriendly} IS NOT NULL OR ${table.difficulty} IS NOT NULL`,
    ),
  ],
);

export const summitPhotoReportTable = pgTable(
  "summit_photo_report",
  {
    id: uuid().primaryKey().defaultRandom(),
    summitId: uuid()
      .notNull()
      .references(() => summitTable.id, { onDelete: "cascade" }),
    reporterId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    photoVersion: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("summit_photo_report_summit_idx").on(table.summitId),
    unique("summit_photo_report_unique_per_version").on(
      table.summitId,
      table.reporterId,
      table.photoVersion,
    ),
  ],
);

export const summitHasUsersTable = pgTable(
  "summit_has_users",
  {
    id: uuid().primaryKey().defaultRandom(),
    summitId: uuid().references(() => summitTable.id, { onDelete: "cascade" }),
    userId: uuid().references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("summit_has_users_summit_id_idx").on(table.summitId),
    index("summit_has_users_user_id_idx").on(table.userId),
  ],
);

export const challengeHasMountainTable = pgTable(
  "challenge_has_mountain",
  {
    id: uuid().primaryKey().defaultRandom(),
    challengeId: uuid().references(() => challengeTable.id, {
      onDelete: "cascade",
    }),
    mountainId: uuid().references(() => mountainTable.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("challenge_has_mountain_challenge_id_idx").on(table.challengeId),
    index("challenge_has_mountain_mountain_id_idx").on(table.mountainId),
  ],
);

export const donorTable = pgTable("donor", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => userTable.id, { onDelete: "cascade" }),
  donation: numeric().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const planTable = pgTable(
  "plan",
  {
    id: uuid().primaryKey().defaultRandom(),
    creatorId: uuid()
      .references(() => userTable.id, { onDelete: "set null" })
      .notNull(),
    challengeId: uuid().references(() => challengeTable.id, {
      onDelete: "set null",
    }), // ⬅️ New optional relation
    title: text().notNull(),
    description: text(),
    imageUrl: text(),
    startDate: date(),
    startTime: text(),
    type: text().$type<PlanType>(),
    speed: text().notNull().$type<PlanSpeed>(),
    status: text().default("open").notNull().$type<PlanStatus>(),
    routeUrl: text(),
    whatsappGroupUrl: text(),
    wikilocUrl: text(),
    stravaUrl: text(),
    isPrivate: boolean().notNull().default(false),
    // Admin-curated flag. Off by default; toggled by admins via
    // /admin/plans/:id and surfaced later for sort/filter in the app.
    featured: boolean().notNull().default(false),
    // Whether participating in this plan requires payment. Off by default;
    // no money flow is wired up yet — the column is informational and the
    // admin form just exposes it as a checkbox.
    paid: boolean().notNull().default(false),
    // Optional hosting organization. Nullable so most plans stay unaffiliated;
    // `set null` keeps the plan alive if the org is later deleted.
    organizationId: uuid().references(() => organizationTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("plan_start_date_status_idx").on(table.startDate, table.status),
  ],
);

export const planHasMountainsTable = pgTable(
  "plan_has_mountains",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid().references(() => planTable.id, { onDelete: "cascade" }),
    mountainId: uuid().references(() => mountainTable.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("plan_has_mountains_plan_id_idx").on(table.planId),
    uniqueIndex("plan_has_mountains_plan_mountain_unq_idx").on(
      table.planId,
      table.mountainId,
    ),
  ],
);

export const planHasUsersTable = pgTable(
  "plan_has_users",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid()
      .references(() => planTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp().notNull().defaultNow(),
    willBringDogs: boolean().notNull().default(false),
    // `member` = regular participant; `organizer` = plan-level admin
    // (e.g. plan creator, club staff). Defaults to `member` so existing
    // rows and new joiners pre-promotion stay non-privileged.
    role: text().notNull().default("member").$type<PlanMemberRole>(),
  },
  (table) => [
    index("plan_has_users_plan_id_idx").on(table.planId),
    index("plan_has_users_user_id_idx").on(table.userId),
  ],
);

export const planMessageTable = pgTable(
  "plan_message",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid()
      .references(() => planTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    message: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index("plan_message_plan_id_idx").on(table.planId)],
);

export const planUserLogTable = pgTable(
  "plan_user_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid()
      .references(() => planTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    action: text().notNull().$type<PlanUserLogAction>(),
    timestamp: timestamp().notNull().defaultNow(),
  },
  (table) => [index("plan_user_log_plan_id_idx").on(table.planId)],
);

export const userRelations = relations(userTable, ({ many }) => ({
  summitHasUsers: many(summitHasUsersTable),
  donors: many(donorTable),
  plansCreated: many(planTable),
  planParticipants: many(planHasUsersTable),
  planMessages: many(planMessageTable),
  planLogs: many(planUserLogTable),
  challengesCreated: many(challengeTable),
  mountainsCreated: many(mountainTable),
}));

export const mountainRelations = relations(mountainTable, ({ one, many }) => ({
  summit: many(summitTable),
  challengeHasMountain: many(challengeHasMountainTable),
  planHasMountains: many(planHasMountainsTable),
  creator: one(userTable, {
    fields: [mountainTable.creatorId],
    references: [userTable.id],
  }),
}));

export const challengeRelation = relations(challengeTable, ({ one, many }) => ({
  challengeHasMountain: many(challengeHasMountainTable),
  creator: one(userTable, {
    fields: [challengeTable.creatorId],
    references: [userTable.id],
  }),
}));

export const summitRelations = relations(summitTable, ({ one, many }) => ({
  summitHasUsers: many(summitHasUsersTable),
  reactions: many(summitReactionTable),
  photoReports: many(summitPhotoReportTable),
  mountain: one(mountainTable, {
    fields: [summitTable.mountainId],
    references: [mountainTable.id],
  }),
  user: one(userTable, {
    fields: [summitTable.userId],
    references: [userTable.id],
  }),
}));

export const summitPhotoReportRelations = relations(
  summitPhotoReportTable,
  ({ one }) => ({
    summit: one(summitTable, {
      fields: [summitPhotoReportTable.summitId],
      references: [summitTable.id],
    }),
    reporter: one(userTable, {
      fields: [summitPhotoReportTable.reporterId],
      references: [userTable.id],
    }),
  }),
);

export const donorRelations = relations(donorTable, ({ one }) => ({
  user: one(userTable, {
    fields: [donorTable.userId],
    references: [userTable.id],
  }),
}));

export const planRelations = relations(planTable, ({ one, many }) => ({
  creator: one(userTable, {
    fields: [planTable.creatorId],
    references: [userTable.id],
  }),
  challenge: one(challengeTable, {
    fields: [planTable.challengeId],
    references: [challengeTable.id],
  }),
  mountains: many(planHasMountainsTable),
  participants: many(planHasUsersTable),
  messages: many(planMessageTable),
  logs: many(planUserLogTable),
}));

export const planUserMessageReadTable = pgTable(
  "plan_user_message_read",
  {
    id: uuid().primaryKey().defaultRandom(),
    planId: uuid()
      .notNull()
      .references(() => planTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    lastReadAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("plan_user_message_read_plan_user_idx").on(
      table.planId,
      table.userId,
    ),
  ],
);

export const planHasMountainsRelations = relations(
  planHasMountainsTable,
  ({ one }) => ({
    plan: one(planTable, {
      fields: [planHasMountainsTable.planId],
      references: [planTable.id],
    }),
    mountain: one(mountainTable, {
      fields: [planHasMountainsTable.mountainId],
      references: [mountainTable.id],
    }),
  }),
);

export const planHasUsersRelations = relations(
  planHasUsersTable,
  ({ one }) => ({
    plan: one(planTable, {
      fields: [planHasUsersTable.planId],
      references: [planTable.id],
    }),
    user: one(userTable, {
      fields: [planHasUsersTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const planMessageRelations = relations(planMessageTable, ({ one }) => ({
  plan: one(planTable, {
    fields: [planMessageTable.planId],
    references: [planTable.id],
  }),
  user: one(userTable, {
    fields: [planMessageTable.userId],
    references: [userTable.id],
  }),
}));

export const planUserLogRelations = relations(planUserLogTable, ({ one }) => ({
  plan: one(planTable, {
    fields: [planUserLogTable.planId],
    references: [planTable.id],
  }),
  user: one(userTable, {
    fields: [planUserLogTable.userId],
    references: [userTable.id],
  }),
}));

export const userPlanVisitTable = pgTable("user_plan_visit", {
  userId: uuid()
    .primaryKey()
    .references(() => userTable.id, { onDelete: "cascade" }),
  lastVisitedAt: timestamp().notNull().defaultNow(),
});

export const planUserMessageReadRelations = relations(
  planUserMessageReadTable,
  ({ one }) => ({
    plan: one(planTable, {
      fields: [planUserMessageReadTable.planId],
      references: [planTable.id],
    }),
    user: one(userTable, {
      fields: [planUserMessageReadTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const summitReactionTable = pgTable(
  "summit_reaction",
  {
    id: uuid().primaryKey().defaultRandom(),
    summitId: uuid()
      .notNull()
      .references(() => summitTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    emoji: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("summit_reaction_summit_id_idx").on(table.summitId),
    index("summit_reaction_summit_user_idx").on(table.summitId, table.userId),
    uniqueIndex("summit_reaction_unique").on(
      table.summitId,
      table.userId,
      table.emoji,
    ),
  ],
);

export const summitReactionRelations = relations(
  summitReactionTable,
  ({ one }) => ({
    summit: one(summitTable, {
      fields: [summitReactionTable.summitId],
      references: [summitTable.id],
    }),
    user: one(userTable, {
      fields: [summitReactionTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const updateSeenTable = pgTable(
  "update_seen",
  {
    id: uuid().primaryKey().defaultRandom(),
    updateId: text().notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    seenAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.updateId, table.userId),
    index("update_seen_user_id_idx").on(table.userId),
  ],
);

export const updateSeenRelations = relations(updateSeenTable, ({ one }) => ({
  user: one(userTable, {
    fields: [updateSeenTable.userId],
    references: [userTable.id],
  }),
}));

export const merchTable = pgTable(
  "merch",
  {
    id: uuid().primaryKey().defaultRandom(),
    slug: text().unique().notNull(),
    nameEn: text().notNull(),
    nameCa: text(),
    nameEs: text(),
    descriptionEn: text(),
    descriptionCa: text(),
    descriptionEs: text(),
    shopUrl: text(),
    imageUrls: text()
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    hasSize: boolean().notNull().default(false),
    sizes: text()
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    price: integer().notNull(),
    discountedPrice: integer(),
    featured: integer(),
    active: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("merch_featured_unique_idx").on(table.featured),
    check(
      "merch_sizes_check",
      sql`${table.sizes} <@ ARRAY['XS','S','M','L','XL','2XL','3XL']::text[]`,
    ),
  ],
);

export const merchVariantTable = pgTable(
  "merch_variant",
  {
    id: uuid().primaryKey().defaultRandom(),
    merchId: uuid()
      .references(() => merchTable.id, { onDelete: "cascade" })
      .notNull(),
    color: text().notNull(),
    imageUrls: text()
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("merch_variant_merch_id_idx").on(table.merchId),
    unique("merch_variant_unique").on(table.merchId, table.color),
  ],
);

export const couponTable = pgTable("coupon", {
  id: uuid().primaryKey().defaultRandom(),
  // Stored display-cased; case-insensitive uniqueness enforced by a
  // LOWER(code) unique index appended to the generated migration SQL.
  code: text().notNull(),
  discountType: text().notNull().$type<CouponDiscountType>(),
  // Percent 1-99 OR euros >= 1, depending on discountType.
  discountValue: integer().notNull(),
  maxUses: integer(),
  onePerUser: boolean().notNull().default(false),
  active: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const couponRedemptionTable = pgTable(
  "coupon_redemption",
  {
    id: uuid().primaryKey().defaultRandom(),
    couponId: uuid()
      .references(() => couponTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    redeemedAt: timestamp().notNull().defaultNow(),
    note: text(),
  },
  (table) => [
    index("coupon_redemption_coupon_id_idx").on(table.couponId),
    index("coupon_redemption_user_id_idx").on(table.userId),
  ],
);

export const shopRequestTable = pgTable(
  "shop_request",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid().references(() => userTable.id, { onDelete: "set null" }),
    userEmail: text().notNull(),
    message: text().notNull(),
    status: text().notNull().default("requested").$type<ShopRequestStatus>(),
    comments: text(),
    paymentImageUrl: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("shop_request_created_at_idx").on(table.createdAt),
    index("shop_request_status_idx").on(table.status),
  ],
);

export const emailLogTable = pgTable(
  "email_log",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    slug: text().notNull(),
    sentAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("email_log_user_slug_sent_idx").on(
      table.userId,
      table.slug,
      table.sentAt,
    ),
    index("email_log_slug_user_idx").on(table.slug, table.userId),
  ],
);

export const userPeopleTable = pgTable(
  "user_people",
  {
    id: uuid().primaryKey().defaultRandom(),
    userAId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    userBId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_people_pair_uniq").on(table.userAId, table.userBId),
    index("user_people_user_a_idx").on(table.userAId),
    index("user_people_user_b_idx").on(table.userBId),
    check("user_people_pair_ordered", sql`${table.userAId} < ${table.userBId}`),
  ],
);

export const orderPeoplePair = (x: string, y: string): [string, string] =>
  x < y ? [x, y] : [y, x];

export const userSavedMountainTable = pgTable(
  "user_saved_mountain",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    mountainId: uuid()
      .notNull()
      .references(() => mountainTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_saved_user_mountain_unique").on(
      table.userId,
      table.mountainId,
    ),
    index("user_saved_user_id_idx").on(table.userId),
    index("user_saved_mountain_id_idx").on(table.mountainId),
  ],
);

// Mirrors `userSavedMountainTable` — the user-saved bookmark list, but for
// routes (Wikiloc trails). Same join-table shape so the React Query plumbing
// on the mobile side reads the same. Cascading on user OR route delete keeps
// us from carrying dangling rows after either side disappears.
export const userSavedRouteTable = pgTable(
  "user_saved_route",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    routeId: uuid()
      .notNull()
      .references(() => routeTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_saved_user_route_unique").on(table.userId, table.routeId),
    index("user_saved_route_user_id_idx").on(table.userId),
    index("user_saved_route_route_id_idx").on(table.routeId),
  ],
);

// Reddit-style threaded comments on mountains. Depth capped at 2 by the API
// (reply to a reply gets re-parented to the top-level ancestor). Upvote
// counts are denormalized here and kept in sync by recalcMountainCommentUpvoteCount
// inside every write path. Same pattern as mountainRatingTable's aggregates.
export const mountainCommentTable = pgTable(
  "mountain_comment",
  {
    id: uuid().primaryKey().defaultRandom(),
    mountainId: uuid()
      .notNull()
      .references(() => mountainTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // Self-ref: null for top-level, or the id of the top-level ancestor.
    // No hard FK to avoid drizzle's forward-ref friction; application
    // enforces existence + same-mountain on insert.
    parentCommentId: uuid(),
    body: text().notNull(),
    // JSONB array so each image can carry future metadata (caption,
    // description) without another schema migration. v1 each element is
    // `{ url: string }`.
    images: jsonb()
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<{ url: string }[]>(),
    upvoteCount: integer().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("mountain_comment_mountain_id_idx").on(table.mountainId),
    index("mountain_comment_parent_id_idx").on(table.parentCommentId),
    index("mountain_comment_user_id_idx").on(table.userId),
  ],
);

export const mountainCommentUpvoteTable = pgTable(
  "mountain_comment_upvote",
  {
    id: uuid().primaryKey().defaultRandom(),
    commentId: uuid()
      .notNull()
      .references(() => mountainCommentTable.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("mountain_comment_upvote_unique_idx").on(
      table.commentId,
      table.userId,
    ),
    index("mountain_comment_upvote_comment_id_idx").on(table.commentId),
  ],
);

// Hiking clubs, guide companies, collectives — any group hosting plans.
// Admin-managed: there's no user-facing creation flow yet. Plans link via
// the nullable `plan.organization_id` (set-null cascade), so deleting an
// org leaves its plans alive but unaffiliated.
export const organizationTable = pgTable("organization", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text(),
  websiteUrl: text(),
  imageUrl: text(),
  // Social URLs. All nullable — orgs only fill in the platforms they use.
  // Mobile renders them as a row of social icons on /organization/[id];
  // admin form has one Input per platform.
  instagramUrl: text(),
  tiktokUrl: text(),
  whatsappUrl: text(),
  youtubeUrl: text(),
  stravaUrl: text(),
  // Showcase gallery (1–10 photos). Distinct from `imageUrl` (the header/logo).
  // Admin-only upload via /admin/organizations/[id]; rendered as a wrapping
  // carousel at the bottom of /organization/[id] on mobile.
  photoUrls: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Locale-keyed string for routes (title + description). Same shape as the
// LocalizedString helper on the app side; kept inline here so the schema
// has no cross-package dependency.
export type LocalizedString = {
  en: string;
  ca: string;
  es: string;
};

// Hiking routes — currently sourced from Wikiloc scrapes (the original
// data lived as static TypeScript files under
// packages/app/domains/route/data; this table replaces those). Each row
// is one route. Multi-mountain routes (a single GPS track that summits
// several catalogued peaks) are joined via `mountain_route` below.
export const routeTable = pgTable(
  "route",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Stable ID from the source (Wikiloc trail id). Unique per source.
    externalId: text().notNull(),
    // Provenance tag — currently always "wikiloc". Lets us add Strava /
    // user-submitted routes later without conflict.
    source: text().notNull(),
    url: text().notNull(),
    // Author's original title (Wikiloc string, often noisy). Kept for
    // attribution + as a fallback if the rewritten title is empty.
    titleRaw: text().notNull(),
    title: jsonb().notNull().$type<LocalizedString>(),
    // Author's original description (raw Wikiloc prose). Nullable because
    // some scrapes had empty descriptions; never shown directly in the UI.
    descriptionRaw: text(),
    // Locale-keyed editorial summary (en/ca/es). Nullable until the
    // Gemini rewrite pass populates it.
    description: jsonb().$type<LocalizedString>(),
    author: text(),
    distanceMeters: integer(),
    elevationGainMeters: integer(),
    elevationLossMeters: integer(),
    maxElevationMeters: integer(),
    minElevationMeters: integer(),
    technicalDifficulty: text(),
    trailType: text(),
    movingTimeSeconds: integer(),
    totalTimeSeconds: integer(),
    coordinatesCount: integer(),
    uploadedAt: text(),
    recordedAt: text(),
    // GPS track. Array of { lat, lng, ele } points. Stored as JSONB so we
    // don't need a separate coordinate table — read+write are always for
    // the whole track and route counts are bounded (~2k rows).
    coordinates: jsonb().$type<{ lat: number; lng: number; ele?: number }[]>(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("route_source_external_id_unq").on(
      table.source,
      table.externalId,
    ),
    index("route_distance_idx").on(table.distanceMeters),
    index("route_trail_type_idx").on(table.trailType),
  ],
);

// Many-to-many join: which catalogued mountains a route summits. Populated
// by the geometric summit detector (packages/api/scripts/wikiloc/lib/
// detect-summits-geometric.ts) — a route appears once per mountain it
// passes within the threshold of. `ordinal` preserves the detector's
// closest-approach order so the UI can show "primary summit" first.
//
// mountain_slug references mountain.slug (unique) rather than mountain.id
// because routes were attributed by slug upstream and the slug is the
// human-readable identifier. Cascade on delete so removing a mountain
// also drops its route attributions.
export const mountainRouteTable = pgTable(
  "mountain_route",
  {
    id: uuid().primaryKey().defaultRandom(),
    mountainSlug: text()
      .notNull()
      .references(() => mountainTable.slug, { onDelete: "cascade" }),
    routeId: uuid()
      .notNull()
      .references(() => routeTable.id, { onDelete: "cascade" }),
    ordinal: integer().notNull().default(0),
  },
  (table) => [
    uniqueIndex("mountain_route_slug_route_unq").on(
      table.mountainSlug,
      table.routeId,
    ),
    index("mountain_route_slug_idx").on(table.mountainSlug),
    index("mountain_route_route_id_idx").on(table.routeId),
  ],
);

export const routeRelations = relations(routeTable, ({ many }) => ({
  mountainRoutes: many(mountainRouteTable),
}));

export const mountainRouteRelations = relations(
  mountainRouteTable,
  ({ one }) => ({
    route: one(routeTable, {
      fields: [mountainRouteTable.routeId],
      references: [routeTable.id],
    }),
  }),
);

// Many-to-many membership between users and organizations — flat list, no
// per-membership role. The organizer/member distinction lives on
// plan_has_users instead (a plan can have organizers from any org or none).
// UUID PK + uniqueIndex matches the project's join-table convention (see
// plan_has_users, plan_has_mountains) — composite PKs would be tidier SQL
// but inconsistent with the rest of the codebase.
export const organizationMemberTable = pgTable(
  "organization_member",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid()
      .references(() => organizationTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("organization_member_org_id_idx").on(table.organizationId),
    index("organization_member_user_id_idx").on(table.userId),
    uniqueIndex("organization_member_org_user_unq_idx").on(
      table.organizationId,
      table.userId,
    ),
  ],
);
