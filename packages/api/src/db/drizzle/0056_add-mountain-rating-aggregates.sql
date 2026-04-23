ALTER TABLE "mountain" ADD COLUMN "avg_family_friendly" real;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "family_rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "avg_dog_friendly" real;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "dog_rating_count" integer DEFAULT 0 NOT NULL;