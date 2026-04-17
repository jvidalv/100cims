CREATE TABLE "summit_photo_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summit_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"photo_version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "summit_photo_report_unique_per_version" UNIQUE("summit_id","reporter_id","photo_version")
);
--> statement-breakpoint
ALTER TABLE "summit" ADD COLUMN "photo_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "summit_photo_report" ADD CONSTRAINT "summit_photo_report_summit_id_summit_id_fk" FOREIGN KEY ("summit_id") REFERENCES "public"."summit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_photo_report" ADD CONSTRAINT "summit_photo_report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "summit_photo_report_summit_idx" ON "summit_photo_report" USING btree ("summit_id");