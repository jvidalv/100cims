ALTER TABLE "user" ADD COLUMN "active_challenge_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_active_challenge_id_challenge_id_fk" FOREIGN KEY ("active_challenge_id") REFERENCES "public"."challenge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "user" SET "active_challenge_id" = '5f996363-7460-4bc8-817c-8dd633c0b504';