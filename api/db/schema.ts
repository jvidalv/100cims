import {
  uuid,
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  url: text().notNull(),
  imageUrl: text(),
});

export const userTable = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull(),
  firstName: text(),
  lastName: text(),
  imageUrl: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const summitTable = pgTable("summit", {
  id: uuid().primaryKey().defaultRandom(),
  imageUrl: text().notNull(),
  mountainId: uuid().references(() => mountainTable.id),
  createdAt: timestamp().notNull().defaultNow(),
});

export const summitHasUsersTable = pgTable("summit_has_users", {
  id: uuid().primaryKey().defaultRandom(),
  summitId: uuid().references(() => summitTable.id),
  userId: uuid().references(() => userTable.id),
  createdAt: timestamp().notNull().defaultNow(),
});

export const userRelations = relations(userTable, ({ many }) => ({
  summitHasUsers: many(summitHasUsersTable),
}));

export const mountainRelations = relations(mountainTable, ({ many }) => ({
  summit: many(summitTable),
}));

export const summitRelations = relations(summitTable, ({ one, many }) => ({
  summitHasUsers: many(summitHasUsersTable),
  mountain: one(mountainTable, {
    fields: [summitTable.mountainId],
    references: [mountainTable.id],
  }),
}));
