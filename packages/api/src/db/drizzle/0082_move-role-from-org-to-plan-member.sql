ALTER TABLE "plan_has_users" ADD COLUMN "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_member" DROP COLUMN "role";