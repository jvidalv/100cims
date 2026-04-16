CREATE TABLE "merch_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merch_id" uuid NOT NULL,
	"color" text NOT NULL,
	"image_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merch_variant_unique" UNIQUE("merch_id","color")
);
--> statement-breakpoint
ALTER TABLE "merch_variant" ADD CONSTRAINT "merch_variant_merch_id_merch_id_fk" FOREIGN KEY ("merch_id") REFERENCES "public"."merch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "merch_variant_merch_id_idx" ON "merch_variant" USING btree ("merch_id");