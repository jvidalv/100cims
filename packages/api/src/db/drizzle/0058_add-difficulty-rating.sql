ALTER TABLE "mountain_rating" DROP CONSTRAINT "mountain_rating_at_least_one_check";--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD COLUMN "difficulty" integer;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "avg_difficulty" real;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "difficulty_rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_difficulty_range_check" CHECK ("mountain_rating"."difficulty" IS NULL OR ("mountain_rating"."difficulty" BETWEEN 1 AND 5));--> statement-breakpoint
ALTER TABLE "mountain_rating" ADD CONSTRAINT "mountain_rating_at_least_one_check" CHECK ("mountain_rating"."family_friendly" IS NOT NULL OR "mountain_rating"."dog_friendly" IS NOT NULL OR "mountain_rating"."difficulty" IS NOT NULL);