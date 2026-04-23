CREATE TABLE "mountain_rating" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"family_friendly" integer,
	"dog_friendly" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mountain_rating_family_range_check" CHECK ("mountain_rating"."family_friendly" IS NULL OR ("mountain_rating"."family_friendly" BETWEEN 1 AND 5)),
	CONSTRAINT "mountain_rating_dog_range_check" CHECK ("mountain_rating"."dog_friendly" IS NULL OR ("mountain_rating"."dog_friendly" BETWEEN 1 AND 5)),
	CONSTRAINT "mountain_rating_at_least_one_check" CHECK ("mountain_rating"."family_friendly" IS NOT NULL OR "mountain_rating"."dog_friendly" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_rating_mountain_user_unique_idx" ON "mountain_rating" USING btree ("mountain_id","user_id");--> statement-breakpoint
CREATE INDEX "mountain_rating_mountain_id_idx" ON "mountain_rating" USING btree ("mountain_id");