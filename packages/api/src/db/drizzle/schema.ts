import { pgTable, index, foreignKey, uuid, numeric, timestamp, text, date, boolean, uniqueIndex, unique, integer, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const challengeHasMountain = pgTable("challenge_has_mountain", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	challengeId: uuid("challenge_id"),
	mountainId: uuid("mountain_id"),
}, (table) => [
	index("challenge_has_mountain_challenge_id_idx").using("btree", table.challengeId.asc().nullsLast().op("uuid_ops")),
	index("challenge_has_mountain_mountain_id_idx").using("btree", table.mountainId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenge.id],
			name: "challenge_has_mountain_challenge_id_challenge_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mountainId],
			foreignColumns: [mountain.id],
			name: "challenge_has_mountain_mountain_id_mountain_id_fk"
		}).onDelete("cascade"),
]);

export const donor = pgTable("donor", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	donation: numeric().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "donor_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const plan = pgTable("plan", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	creatorId: uuid("creator_id").notNull(),
	challengeId: uuid("challenge_id"),
	title: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	startDate: date("start_date"),
	speed: text().notNull(),
	status: text().default('open').notNull(),
	routeUrl: text("route_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [user.id],
			name: "plan_creator_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenge.id],
			name: "plan_challenge_id_challenge_id_fk"
		}).onDelete("set null"),
]);

export const planHasMountains = pgTable("plan_has_mountains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id"),
	mountainId: uuid("mountain_id"),
}, (table) => [
	index("plan_has_mountains_plan_id_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plan.id],
			name: "plan_has_mountains_plan_id_plan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mountainId],
			foreignColumns: [mountain.id],
			name: "plan_has_mountains_mountain_id_mountain_id_fk"
		}).onDelete("cascade"),
]);

export const planHasUsers = pgTable("plan_has_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id").notNull(),
	userId: uuid("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
	willBringDogs: boolean("will_bring_dogs").default(false).notNull(),
}, (table) => [
	index("plan_has_users_plan_id_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops")),
	index("plan_has_users_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plan.id],
			name: "plan_has_users_plan_id_plan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "plan_has_users_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const planMessage = pgTable("plan_message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id").notNull(),
	userId: uuid("user_id").notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("plan_message_plan_id_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plan.id],
			name: "plan_message_plan_id_plan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "plan_message_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const planUserLog = pgTable("plan_user_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id").notNull(),
	userId: uuid("user_id").notNull(),
	action: text().notNull(),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plan.id],
			name: "plan_user_log_plan_id_plan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "plan_user_log_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const planUserMessageRead = pgTable("plan_user_message_read", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	planId: uuid("plan_id").notNull(),
	userId: uuid("user_id").notNull(),
	lastReadAt: timestamp("last_read_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("plan_user_message_read_plan_user_idx").using("btree", table.planId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plan.id],
			name: "plan_user_message_read_plan_id_plan_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "plan_user_message_read_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const summitHasUsers = pgTable("summit_has_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	summitId: uuid("summit_id"),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("summit_has_users_summit_id_idx").using("btree", table.summitId.asc().nullsLast().op("uuid_ops")),
	index("summit_has_users_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.summitId],
			foreignColumns: [summit.id],
			name: "summit_has_users_summit_id_summit_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "summit_has_users_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const userPlanVisit = pgTable("user_plan_visit", {
	userId: uuid("user_id").primaryKey().notNull(),
	lastVisitedAt: timestamp("last_visited_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_plan_visit_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const summit = pgTable("summit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	mountainId: uuid("mountain_id"),
	imageUrl: text("image_url").notNull(),
	validated: boolean().default(true).notNull(),
	summitedAt: date("summited_at").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	userId: uuid("user_id"),
}, (table) => [
	index("summit_mountain_id_idx").using("btree", table.mountainId.asc().nullsLast().op("uuid_ops")),
	index("summit_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.mountainId],
			foreignColumns: [mountain.id],
			name: "summit_mountain_id_mountain_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "summit_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const summitReaction = pgTable("summit_reaction", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	summitId: uuid("summit_id").notNull(),
	userId: uuid("user_id").notNull(),
	emoji: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("summit_reaction_summit_id_idx").using("btree", table.summitId.asc().nullsLast().op("uuid_ops")),
	index("summit_reaction_summit_user_idx").using("btree", table.summitId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("summit_reaction_unique").using("btree", table.summitId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops"), table.emoji.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.summitId],
			foreignColumns: [summit.id],
			name: "summit_reaction_summit_id_summit_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "summit_reaction_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const updateSeen = pgTable("update_seen", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	updateId: text("update_id").notNull(),
	userId: uuid("user_id").notNull(),
	seenAt: timestamp("seen_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("update_seen_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "update_seen_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("update_seen_updateId_userId_unique").on(table.updateId, table.userId),
]);

export const merch = pgTable("merch", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	nameEn: text("name_en").notNull(),
	nameCa: text("name_ca"),
	nameEs: text("name_es"),
	descriptionEn: text("description_en"),
	descriptionCa: text("description_ca"),
	descriptionEs: text("description_es"),
	shopUrl: text("shop_url"),
	imageUrls: text("image_urls").array().default(["RAY"]).notNull(),
	hasSize: boolean("has_size").default(false).notNull(),
	price: integer().notNull(),
	featured: integer(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("merch_featured_unique_idx").using("btree", table.featured.asc().nullsLast().op("int4_ops")),
	unique("merch_slug_unique").on(table.slug),
]);

export const mountain = pgTable("mountain", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	location: text().notNull(),
	essential: boolean().notNull(),
	height: numeric().notNull(),
	latitude: numeric().notNull(),
	longitude: numeric().notNull(),
	utm31Tx: numeric(),
	utm31Ty: numeric(),
	url: text(),
	imageUrl: text("image_url"),
	creatorId: uuid("creator_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [user.id],
			name: "mountain_creator_id_user_id_fk"
		}).onDelete("set null"),
	unique("mountain_slug_unique").on(table.slug),
]);

export const challenge = pgTable("challenge", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	webUrl: text("web_url"),
	country: text().notNull(),
	creatorId: uuid("creator_id"),
	description: text(),
	imageUrl: text("image_url"),
	isPublic: boolean("is_public").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	emoji: text(),
}, (table) => [
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [user.id],
			name: "challenge_creator_id_user_id_fk"
		}).onDelete("set null"),
	unique("challenge_slug_unique").on(table.slug),
]);

export const user = pgTable("user", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: text().default(sql`(\'default_\'::text || (random())::text)`).notNull(),
	email: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url"),
	locale: text(),
	town: text(),
	visibleOnHiscores: boolean("visible_on_hiscores").default(false).notNull(),
	visibleOnPeopleSearch: boolean("visible_on_people_search").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	activeChallengeId: uuid("active_challenge_id"),
	admin: boolean().default(false).notNull(),
	country: text(),
	platform: text(),
	appVersion: text("app_version"),
	lastLatitude: numeric("last_latitude"),
	lastLongitude: numeric("last_longitude"),
	lastLocationAt: timestamp("last_location_at", { mode: 'string' }),
	expoPushToken: text("expo_push_token"),
	pushNotificationsEnabled: boolean("push_notifications_enabled").default(true).notNull(),
	emailNotificationsEnabled: boolean("email_notifications_enabled").default(true).notNull(),
}, (table) => [
	unique("user_username_unique").on(table.username),
	unique("user_email_unique").on(table.email),
]);

export const emailLog = pgTable("email_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	slug: text().notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_log_user_slug_sent_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.slug.asc().nullsLast().op("text_ops"), table.sentAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "email_log_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const userPeople = pgTable("user_people", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userAId: uuid("user_a_id").notNull(),
	userBId: uuid("user_b_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("user_people_pair_uniq").using("btree", table.userAId.asc().nullsLast().op("uuid_ops"), table.userBId.asc().nullsLast().op("uuid_ops")),
	index("user_people_user_a_idx").using("btree", table.userAId.asc().nullsLast().op("uuid_ops")),
	index("user_people_user_b_idx").using("btree", table.userBId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userAId],
			foreignColumns: [user.id],
			name: "user_people_user_a_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userBId],
			foreignColumns: [user.id],
			name: "user_people_user_b_id_user_id_fk"
		}).onDelete("cascade"),
	check("user_people_pair_ordered", sql`user_a_id < user_b_id`),
]);
