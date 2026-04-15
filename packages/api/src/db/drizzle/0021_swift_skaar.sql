CREATE TABLE "user_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" uuid NOT NULL,
	"user_b_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_people_pair_ordered" CHECK ("user_people"."user_a_id" < "user_people"."user_b_id")
);
--> statement-breakpoint
ALTER TABLE "user_people" ADD CONSTRAINT "user_people_user_a_id_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_people" ADD CONSTRAINT "user_people_user_b_id_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_people_pair_uniq" ON "user_people" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "user_people_user_a_idx" ON "user_people" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "user_people_user_b_idx" ON "user_people" USING btree ("user_b_id");--> statement-breakpoint
-- Seed user_people from co-summits: anyone who summited together gets
-- connected, with created_at = date of the first shared summit.
INSERT INTO user_people (user_a_id, user_b_id, created_at)
SELECT
  LEAST(a.user_id, b.user_id)    AS user_a_id,
  GREATEST(a.user_id, b.user_id) AS user_b_id,
  MIN(s.summited_at)::timestamp  AS created_at
FROM summit_has_users a
JOIN summit_has_users b ON a.summit_id = b.summit_id AND a.user_id < b.user_id
JOIN summit s ON s.id = a.summit_id
WHERE a.user_id IS NOT NULL AND b.user_id IS NOT NULL
GROUP BY LEAST(a.user_id, b.user_id), GREATEST(a.user_id, b.user_id)
ON CONFLICT (user_a_id, user_b_id) DO NOTHING;
