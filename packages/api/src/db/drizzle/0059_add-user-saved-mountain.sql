CREATE TABLE "user_saved_mountain" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mountain_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_saved_mountain" ADD CONSTRAINT "user_saved_mountain_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_mountain" ADD CONSTRAINT "user_saved_mountain_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_user_mountain_unique" ON "user_saved_mountain" USING btree ("user_id","mountain_id");--> statement-breakpoint
CREATE INDEX "user_saved_user_id_idx" ON "user_saved_mountain" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_saved_mountain_id_idx" ON "user_saved_mountain" USING btree ("mountain_id");