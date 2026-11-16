CREATE TABLE "meetups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text,
	"title" text NOT NULL,
	"address" text NOT NULL,
	"place_description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" integer NOT NULL,
	"occupied_seats" integer NOT NULL,
	"creator_with_companion" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meetups_occupied_within_capacity" CHECK ("meetups"."occupied_seats" <= "meetups"."capacity"),
	CONSTRAINT "meetups_ends_after_start" CHECK ("meetups"."ends_at" > "meetups"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;