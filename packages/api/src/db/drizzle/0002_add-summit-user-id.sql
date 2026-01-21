ALTER TABLE "summit" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "summit" ADD CONSTRAINT "summit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Backfill: Set user_id to the first user associated with each summit (by created_at)
UPDATE "summit" s
SET "user_id" = (
  SELECT shu."user_id"
  FROM "summit_has_users" shu
  WHERE shu."summit_id" = s."id"
  ORDER BY shu."created_at" ASC
  LIMIT 1
)
WHERE s."user_id" IS NULL;