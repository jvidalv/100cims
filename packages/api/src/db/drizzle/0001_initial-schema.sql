CREATE TABLE "challenge_has_mountain" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid,
	"mountain_id" uuid
);
--> statement-breakpoint
CREATE TABLE "challenge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"web_url" text,
	"country" text NOT NULL,
	"creator_id" uuid,
	"description" text,
	"image_url" text,
	"emoji" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"one_per_user" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"donation" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ca" text,
	"name_es" text,
	"description_en" text,
	"description_ca" text,
	"description_es" text,
	"shop_url" text,
	"image_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"has_size" boolean DEFAULT false NOT NULL,
	"sizes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"price" integer NOT NULL,
	"discounted_price" integer,
	"featured" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merch_slug_unique" UNIQUE("slug"),
	CONSTRAINT "merch_sizes_check" CHECK ("merch"."sizes" <@ ARRAY['XS','S','M','L','XL','2XL','3XL']::text[])
);
--> statement-breakpoint
CREATE TABLE "merch_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merch_id" uuid NOT NULL,
	"color" text NOT NULL,
	"image_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merch_variant_unique" UNIQUE("merch_id","color")
);
--> statement-breakpoint
CREATE TABLE "mountain_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain_comment_upvote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain_rating" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"family_friendly" integer,
	"dog_friendly" integer,
	"difficulty" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mountain_rating_family_range_check" CHECK ("mountain_rating"."family_friendly" IS NULL OR ("mountain_rating"."family_friendly" BETWEEN 1 AND 5)),
	CONSTRAINT "mountain_rating_dog_range_check" CHECK ("mountain_rating"."dog_friendly" IS NULL OR ("mountain_rating"."dog_friendly" BETWEEN 1 AND 5)),
	CONSTRAINT "mountain_rating_difficulty_range_check" CHECK ("mountain_rating"."difficulty" IS NULL OR ("mountain_rating"."difficulty" BETWEEN 1 AND 5)),
	CONSTRAINT "mountain_rating_at_least_one_check" CHECK ("mountain_rating"."family_friendly" IS NOT NULL OR "mountain_rating"."dog_friendly" IS NOT NULL OR "mountain_rating"."difficulty" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "mountain_route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_slug" text NOT NULL,
	"route_id" uuid NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"location" text NOT NULL,
	"essential" boolean NOT NULL,
	"height" numeric NOT NULL,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"utm31tx" numeric,
	"utm31ty" numeric,
	"url" text,
	"image_url" text,
	"creator_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"avg_family_friendly" real,
	"family_rating_count" integer DEFAULT 0 NOT NULL,
	"avg_dog_friendly" real,
	"dog_rating_count" integer DEFAULT 0 NOT NULL,
	"avg_difficulty" real,
	"difficulty_rating_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mountain_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"image_url" text,
	"instagram_url" text,
	"tiktok_url" text,
	"whatsapp_url" text,
	"youtube_url" text,
	"strava_url" text,
	"photo_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_has_mountains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid,
	"mountain_id" uuid
);
--> statement-breakpoint
CREATE TABLE "plan_has_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"will_bring_dogs" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"challenge_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"start_date" date,
	"start_time" text,
	"type" text,
	"speed" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"route_url" text,
	"whatsapp_group_url" text,
	"wikiloc_url" text,
	"strava_url" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_user_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_user_message_read" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"source" text NOT NULL,
	"url" text NOT NULL,
	"title_raw" text NOT NULL,
	"title" jsonb NOT NULL,
	"description_raw" text,
	"description" jsonb,
	"author" text,
	"distance_meters" integer,
	"elevation_gain_meters" integer,
	"elevation_loss_meters" integer,
	"max_elevation_meters" integer,
	"min_elevation_meters" integer,
	"technical_difficulty" text,
	"trail_type" text,
	"moving_time_seconds" integer,
	"total_time_seconds" integer,
	"coordinates_count" integer,
	"uploaded_at" text,
	"recorded_at" text,
	"coordinates" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"comments" text,
	"payment_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summit_has_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summit_id" uuid,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summit_photo_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summit_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"photo_version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "summit_photo_report_unique_per_version" UNIQUE("summit_id","reporter_id","photo_version")
);
--> statement-breakpoint
CREATE TABLE "summit_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid,
	"user_id" uuid,
	"image_url" text NOT NULL,
	"photo_version" integer DEFAULT 0 NOT NULL,
	"validated" boolean DEFAULT true NOT NULL,
	"summited_at" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "update_seen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"update_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "update_seen_updateId_userId_unique" UNIQUE("update_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" uuid NOT NULL,
	"user_b_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_people_pair_ordered" CHECK ("user_people"."user_a_id" < "user_people"."user_b_id")
);
--> statement-breakpoint
CREATE TABLE "user_plan_visit" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"last_visited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_saved_mountain" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mountain_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_saved_route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text DEFAULT 'default_' || random()::text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"locale" text,
	"town" text,
	"phone_number" text,
	"shipping_street" text,
	"shipping_city" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"visible_on_hiscores" boolean DEFAULT false NOT NULL,
	"visible_on_people_search" boolean DEFAULT true NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"country" text,
	"platform" text,
	"app_version" text,
	"last_latitude" numeric,
	"last_longitude" numeric,
	"last_location_at" timestamp,
	"active_challenge_id" uuid,
	"expo_push_token" text,
	"push_notifications_enabled" boolean DEFAULT true NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true NOT NULL,
	"unlockables" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "challenge_has_mountain" ADD CONSTRAINT "challenge_has_mountain_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_has_mountain" ADD CONSTRAINT "challenge_has_mountain_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge" ADD CONSTRAINT "challenge_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor" ADD CONSTRAINT "donor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merch_variant" ADD CONSTRAINT "merch_variant_merch_id_merch_id_fk" FOREIGN KEY ("merch_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment" ADD CONSTRAINT "mountain_comment_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment" ADD CONSTRAINT "mountain_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment_upvote" ADD CONSTRAINT "mountain_comment_upvote_comment_id_mountain_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."mountain_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment_upvote" ADD CONSTRAINT "mountain_comment_upvote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_route" ADD CONSTRAINT "mountain_route_mountain_slug_mountain_slug_fk" FOREIGN KEY ("mountain_slug") REFERENCES "public"."mountain"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_route" ADD CONSTRAINT "mountain_route_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain" ADD CONSTRAINT "mountain_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_has_mountains" ADD CONSTRAINT "plan_has_mountains_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_has_mountains" ADD CONSTRAINT "plan_has_mountains_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_has_users" ADD CONSTRAINT "plan_has_users_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_has_users" ADD CONSTRAINT "plan_has_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_message" ADD CONSTRAINT "plan_message_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_message" ADD CONSTRAINT "plan_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_challenge_id_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_user_log" ADD CONSTRAINT "plan_user_log_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_user_log" ADD CONSTRAINT "plan_user_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_user_message_read" ADD CONSTRAINT "plan_user_message_read_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_user_message_read" ADD CONSTRAINT "plan_user_message_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_request" ADD CONSTRAINT "shop_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_has_users" ADD CONSTRAINT "summit_has_users_summit_id_summit_id_fk" FOREIGN KEY ("summit_id") REFERENCES "public"."summit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_has_users" ADD CONSTRAINT "summit_has_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_photo_report" ADD CONSTRAINT "summit_photo_report_summit_id_summit_id_fk" FOREIGN KEY ("summit_id") REFERENCES "public"."summit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_photo_report" ADD CONSTRAINT "summit_photo_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_reaction" ADD CONSTRAINT "summit_reaction_summit_id_summit_id_fk" FOREIGN KEY ("summit_id") REFERENCES "public"."summit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_reaction" ADD CONSTRAINT "summit_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit" ADD CONSTRAINT "summit_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit" ADD CONSTRAINT "summit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "update_seen" ADD CONSTRAINT "update_seen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_people" ADD CONSTRAINT "user_people_user_a_id_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_people" ADD CONSTRAINT "user_people_user_b_id_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_plan_visit" ADD CONSTRAINT "user_plan_visit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_mountain" ADD CONSTRAINT "user_saved_mountain_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_mountain" ADD CONSTRAINT "user_saved_mountain_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_route" ADD CONSTRAINT "user_saved_route_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_route" ADD CONSTRAINT "user_saved_route_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_has_mountain_challenge_id_idx" ON "challenge_has_mountain" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_has_mountain_mountain_id_idx" ON "challenge_has_mountain" USING btree ("mountain_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_coupon_id_idx" ON "coupon_redemption" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_user_id_idx" ON "coupon_redemption" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_log_user_slug_sent_idx" ON "email_log" USING btree ("user_id","slug","sent_at");--> statement-breakpoint
CREATE INDEX "email_log_slug_user_idx" ON "email_log" USING btree ("slug","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "merch_featured_unique_idx" ON "merch" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "merch_variant_merch_id_idx" ON "merch_variant" USING btree ("merch_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_mountain_id_idx" ON "mountain_comment" USING btree ("mountain_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_parent_id_idx" ON "mountain_comment" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_user_id_idx" ON "mountain_comment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_comment_upvote_unique_idx" ON "mountain_comment_upvote" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_upvote_comment_id_idx" ON "mountain_comment_upvote" USING btree ("comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_rating_mountain_user_unique_idx" ON "mountain_rating" USING btree ("mountain_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_route_slug_route_unq" ON "mountain_route" USING btree ("mountain_slug","route_id");--> statement-breakpoint
CREATE INDEX "mountain_route_slug_idx" ON "mountain_route" USING btree ("mountain_slug");--> statement-breakpoint
CREATE INDEX "mountain_route_route_id_idx" ON "mountain_route" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "organization_member_org_id_idx" ON "organization_member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_member_user_id_idx" ON "organization_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_member_org_user_unq_idx" ON "organization_member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "plan_has_mountains_plan_id_idx" ON "plan_has_mountains" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_has_mountains_plan_mountain_unq_idx" ON "plan_has_mountains" USING btree ("plan_id","mountain_id");--> statement-breakpoint
CREATE INDEX "plan_has_users_plan_id_idx" ON "plan_has_users" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_has_users_user_id_idx" ON "plan_has_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plan_message_plan_id_idx" ON "plan_message" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_start_date_status_idx" ON "plan" USING btree ("start_date","status");--> statement-breakpoint
CREATE INDEX "plan_user_log_plan_id_idx" ON "plan_user_log" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_user_message_read_plan_user_idx" ON "plan_user_message_read" USING btree ("plan_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "route_source_external_id_unq" ON "route" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "route_distance_idx" ON "route" USING btree ("distance_meters");--> statement-breakpoint
CREATE INDEX "route_trail_type_idx" ON "route" USING btree ("trail_type");--> statement-breakpoint
CREATE INDEX "shop_request_created_at_idx" ON "shop_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shop_request_status_idx" ON "shop_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "summit_has_users_summit_id_idx" ON "summit_has_users" USING btree ("summit_id");--> statement-breakpoint
CREATE INDEX "summit_has_users_user_id_idx" ON "summit_has_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "summit_photo_report_summit_idx" ON "summit_photo_report" USING btree ("summit_id");--> statement-breakpoint
CREATE INDEX "summit_reaction_summit_id_idx" ON "summit_reaction" USING btree ("summit_id");--> statement-breakpoint
CREATE INDEX "summit_reaction_summit_user_idx" ON "summit_reaction" USING btree ("summit_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "summit_reaction_unique" ON "summit_reaction" USING btree ("summit_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "summit_user_id_idx" ON "summit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "summit_mountain_id_idx" ON "summit" USING btree ("mountain_id");--> statement-breakpoint
CREATE INDEX "update_seen_user_id_idx" ON "update_seen" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_people_pair_uniq" ON "user_people" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "user_people_user_a_idx" ON "user_people" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "user_people_user_b_idx" ON "user_people" USING btree ("user_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_user_mountain_unique" ON "user_saved_mountain" USING btree ("user_id","mountain_id");--> statement-breakpoint
CREATE INDEX "user_saved_user_id_idx" ON "user_saved_mountain" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_saved_mountain_id_idx" ON "user_saved_mountain" USING btree ("mountain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_user_route_unique" ON "user_saved_route" USING btree ("user_id","route_id");--> statement-breakpoint
CREATE INDEX "user_saved_route_user_id_idx" ON "user_saved_route" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_saved_route_route_id_idx" ON "user_saved_route" USING btree ("route_id");