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
	"price" integer NOT NULL,
	"featured" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merch_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "expo_push_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "push_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "merch_featured_unique_idx" ON "merch" USING btree ("featured");