CREATE TABLE "mountain_route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_slug" text NOT NULL,
	"route_id" uuid NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL
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
ALTER TABLE "mountain_route" ADD CONSTRAINT "mountain_route_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_route_slug_route_unq" ON "mountain_route" USING btree ("mountain_slug","route_id");--> statement-breakpoint
CREATE INDEX "mountain_route_slug_idx" ON "mountain_route" USING btree ("mountain_slug");--> statement-breakpoint
CREATE INDEX "mountain_route_route_id_idx" ON "mountain_route" USING btree ("route_id");--> statement-breakpoint
CREATE UNIQUE INDEX "route_source_external_id_unq" ON "route" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "route_distance_idx" ON "route" USING btree ("distance_meters");--> statement-breakpoint
CREATE INDEX "route_trail_type_idx" ON "route" USING btree ("trail_type");