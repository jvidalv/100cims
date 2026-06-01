CREATE TABLE IF NOT EXISTS "user_saved_route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "user_saved_route" ADD CONSTRAINT "user_saved_route_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "user_saved_route" ADD CONSTRAINT "user_saved_route_route_id_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_saved_user_route_unique" ON "user_saved_route" USING btree ("user_id","route_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_saved_route_user_id_idx" ON "user_saved_route" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_saved_route_route_id_idx" ON "user_saved_route" USING btree ("route_id");
