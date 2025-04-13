import { relations, sql } from "drizzle-orm";
import {
  uuid,
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const challengeTable = pgTable("challenge", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().unique().notNull(),
  webUrl: text(),
  country: text().notNull(),
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
  visibleOnHiscores: boolean().notNull().default(false),
  visibleOnPeopleSearch: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const summitTable = pgTable("summit", {
  id: uuid().primaryKey().defaultRandom(),
  mountainId: uuid().references(() => mountainTable.id, {
    onDelete: "cascade",
  }),
  imageUrl: text().notNull(),
  validated: boolean().notNull().default(true),
  summitedAt: date().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const summitHasUsersTable = pgTable("summit_has_users", {
  id: uuid().primaryKey().defaultRandom(),
  summitId: uuid().references(() => summitTable.id, { onDelete: "cascade" }),
  userId: uuid().references(() => userTable.id, { onDelete: "cascade" }),
  createdAt: timestamp().notNull().defaultNow(),
});

export const challengeHasMountainTable = pgTable("challenge_has_mountain", {
  id: uuid().primaryKey().defaultRandom(),
  challengeId: uuid().references(() => challengeTable.id, {
    onDelete: "cascade",
  }),
  mountainId: uuid().references(() => mountainTable.id, {
    onDelete: "cascade",
  }),
});

export const donorTable = pgTable("donor", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => userTable.id, { onDelete: "cascade" }),
  donation: numeric().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const planTable = pgTable("plan", {
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
  speed: text().notNull(), // 'chill' | 'normal' | 'fast'
  status: text()
    .default("open")
    .notNull()
    .$type<"open" | "completed" | "canceled">(),
  routeUrl: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const planHasMountainsTable = pgTable("plan_has_mountains", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid().references(() => planTable.id, { onDelete: "cascade" }),
  mountainId: uuid().references(() => mountainTable.id, {
    onDelete: "cascade",
  }),
});

export const planHasUsersTable = pgTable("plan_has_users", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .references(() => planTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid()
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  joinedAt: timestamp().notNull().defaultNow(),
  willBringDogs: boolean().notNull().default(false),
});

export const planMessageTable = pgTable("plan_message", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .references(() => planTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid()
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  message: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});

export const planUserLogTable = pgTable("plan_user_log", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .references(() => planTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid()
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  action: text().notNull(), // 'joined' | 'left'
  timestamp: timestamp().notNull().defaultNow(),
});

export const userRelations = relations(userTable, ({ many }) => ({
  summitHasUsers: many(summitHasUsersTable),
  donors: many(donorTable),
  plansCreated: many(planTable),
  planParticipants: many(planHasUsersTable),
  planMessages: many(planMessageTable),
  planLogs: many(planUserLogTable),
}));

export const mountainRelations = relations(mountainTable, ({ many }) => ({
  summit: many(summitTable),
  challengeHasMountain: many(challengeHasMountainTable),
  planHasMountains: many(planHasMountainsTable),
}));

export const challengeRelation = relations(challengeTable, ({ many }) => ({
  challengeHasMountain: many(challengeHasMountainTable),
}));

export const summitRelations = relations(summitTable, ({ one, many }) => ({
  summitHasUsers: many(summitHasUsersTable),
  mountain: one(mountainTable, {
    fields: [summitTable.mountainId],
    references: [mountainTable.id],
  }),
}));

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

export const planUserMessageReadTable = pgTable("plan_user_message_read", {
  id: uuid().primaryKey().defaultRandom(),
  planId: uuid()
    .notNull()
    .references(() => planTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  lastReadAt: timestamp().notNull().defaultNow(),
});

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
