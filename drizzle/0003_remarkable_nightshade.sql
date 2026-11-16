CREATE TYPE "public"."meetup_status" AS ENUM('active', 'cancelled');--> statement-breakpoint
ALTER TABLE "meetups" ADD COLUMN "status" "meetup_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "meetups" ADD COLUMN "edited_at" timestamp with time zone;