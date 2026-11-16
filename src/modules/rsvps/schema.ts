import { boolean, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { meetups } from "@/modules/meetups/schema";
import { user } from "@/shared/auth/schema";

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetupId: uuid("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    withCompanion: boolean("with_companion").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("rsvps_one_per_user").on(table.meetupId, table.userId)],
);
