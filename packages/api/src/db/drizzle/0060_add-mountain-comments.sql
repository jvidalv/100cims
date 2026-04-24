CREATE TABLE "mountain_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mountain_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"body" text NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mountain_comment_upvote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mountain_comment" ADD CONSTRAINT "mountain_comment_mountain_id_mountain_id_fk" FOREIGN KEY ("mountain_id") REFERENCES "public"."mountain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment" ADD CONSTRAINT "mountain_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment_upvote" ADD CONSTRAINT "mountain_comment_upvote_comment_id_mountain_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."mountain_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain_comment_upvote" ADD CONSTRAINT "mountain_comment_upvote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mountain_comment_mountain_id_idx" ON "mountain_comment" USING btree ("mountain_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_parent_id_idx" ON "mountain_comment" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_user_id_idx" ON "mountain_comment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mountain_comment_upvote_unique_idx" ON "mountain_comment_upvote" USING btree ("comment_id","user_id");--> statement-breakpoint
CREATE INDEX "mountain_comment_upvote_comment_id_idx" ON "mountain_comment_upvote" USING btree ("comment_id");