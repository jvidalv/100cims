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

export const userRelations = relations(userTable, ({ many }) => ({
  summitHasUsers: many(summitHasUsersTable),
}));

export const mountainRelations = relations(mountainTable, ({ many }) => ({
  summit: many(summitTable),
  challengeHasMountain: many(challengeHasMountainTable),
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
