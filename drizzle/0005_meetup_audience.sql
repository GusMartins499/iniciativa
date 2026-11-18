ALTER TABLE "meetups" ADD COLUMN "community_slug" text;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_community_slug_communities_slug_fk" FOREIGN KEY ("community_slug") REFERENCES "public"."communities"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meetups_status_starts_at_idx" ON "meetups" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "meetups_community_slug_idx" ON "meetups" USING btree ("community_slug");