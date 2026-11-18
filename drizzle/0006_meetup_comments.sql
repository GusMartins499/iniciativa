CREATE TABLE "meetup_comment_stats" (
	"meetup_id" uuid PRIMARY KEY NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"distinct_authors" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetup_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meetup_id" uuid NOT NULL,
	"author_id" text,
	"body" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meetup_comments_body_max_500" CHECK (char_length("meetup_comments"."body") <= 500)
);
--> statement-breakpoint
ALTER TABLE "meetup_comment_stats" ADD CONSTRAINT "meetup_comment_stats_meetup_id_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_comments" ADD CONSTRAINT "meetup_comments_meetup_id_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_comments" ADD CONSTRAINT "meetup_comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meetup_comments_meetup_id_created_at_idx" ON "meetup_comments" USING btree ("meetup_id","created_at");--> statement-breakpoint
CREATE INDEX "meetup_comments_author_id_created_at_idx" ON "meetup_comments" USING btree ("author_id","created_at");