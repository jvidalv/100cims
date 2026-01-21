ALTER TABLE "challenge" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "challenge" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "challenge" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "challenge" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "creator_id" uuid;--> statement-breakpoint
ALTER TABLE "mountain" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "challenge" ADD CONSTRAINT "challenge_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mountain" ADD CONSTRAINT "mountain_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;