import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { CommunitySlug } from "@/modules/communities/client";
import { communities } from "@/modules/communities/schema";
import { user } from "@/shared/auth/schema";

export const meetupStatus = pgEnum("meetup_status", ["active", "cancelled"]);

export const meetups = pgTable(
  "meetups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable: a exclusão de conta mantém encontros passados sem o criador.
    creatorId: text("creator_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    address: text("address").notNull(),
    placeDescription: text("place_description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull(),
    // Fonte única da ocupação; só muda com a linha travada (rsvps, card #4).
    occupiedSeats: integer("occupied_seats").notNull(),
    creatorWithCompanion: boolean("creator_with_companion").notNull(),
    // Público: null é aberto a todos; o slug restringe aos membros. Não muda depois de criado.
    communitySlug: text("community_slug")
      .$type<CommunitySlug>()
      .references(() => communities.slug, { onDelete: "restrict" }),
    status: meetupStatus("status").notNull().default("active"),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("meetups_occupied_within_capacity", sql`${table.occupiedSeats} <= ${table.capacity}`),
    check("meetups_ends_after_start", sql`${table.endsAt} > ${table.startsAt}`),
    index("meetups_status_starts_at_idx").on(table.status, table.startsAt),
    index("meetups_community_slug_idx").on(table.communitySlug),
  ],
);
