CREATE TABLE "shop_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_request" ADD CONSTRAINT "shop_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shop_request_created_at_idx" ON "shop_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "shop_request_status_idx" ON "shop_request" USING btree ("status");--> statement-breakpoint
ALTER TABLE "shop_request" ADD CONSTRAINT "shop_request_status_check" CHECK (status IN ('requested', 'contacted', 'done', 'cancelled'));