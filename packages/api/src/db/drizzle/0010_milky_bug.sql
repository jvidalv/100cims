CREATE INDEX "challenge_has_mountain_challenge_id_idx" ON "challenge_has_mountain" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_has_mountain_mountain_id_idx" ON "challenge_has_mountain" USING btree ("mountain_id");--> statement-breakpoint
CREATE INDEX "plan_has_mountains_plan_id_idx" ON "plan_has_mountains" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_has_users_plan_id_idx" ON "plan_has_users" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_has_users_user_id_idx" ON "plan_has_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plan_message_plan_id_idx" ON "plan_message" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_user_message_read_plan_user_idx" ON "plan_user_message_read" USING btree ("plan_id","user_id");--> statement-breakpoint
CREATE INDEX "summit_has_users_summit_id_idx" ON "summit_has_users" USING btree ("summit_id");--> statement-breakpoint
CREATE INDEX "summit_has_users_user_id_idx" ON "summit_has_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "summit_reaction_summit_id_idx" ON "summit_reaction" USING btree ("summit_id");--> statement-breakpoint
CREATE INDEX "summit_reaction_summit_user_idx" ON "summit_reaction" USING btree ("summit_id","user_id");--> statement-breakpoint
CREATE INDEX "summit_user_id_idx" ON "summit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "summit_mountain_id_idx" ON "summit" USING btree ("mountain_id");