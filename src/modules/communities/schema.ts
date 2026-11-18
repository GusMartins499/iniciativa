import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/shared/auth/schema";

// Só dá integridade às FKs: a lista vive em list.ts, e as linhas entram pela migração.
export const communities = pgTable("communities", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
});

export const communityMemberships = pgTable(
  "community_memberships",
  {
    communitySlug: text("community_slug")
      .notNull()
      .references(() => communities.slug),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.communitySlug, table.userId] })],
);
