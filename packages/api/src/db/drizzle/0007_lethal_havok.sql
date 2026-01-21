CREATE TABLE "summit_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "summit_reaction" ADD CONSTRAINT "summit_reaction_summit_id_summit_id_fk" FOREIGN KEY ("summit_id") REFERENCES "public"."summit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summit_reaction" ADD CONSTRAINT "summit_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "summit_reaction_unique" ON "summit_reaction" ("summit_id", "user_id", "emoji");