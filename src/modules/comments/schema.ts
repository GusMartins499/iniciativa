import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { meetups } from "@/modules/meetups/schema";
import { user } from "@/shared/auth/schema";

export const meetupComments = pgTable(
  "meetup_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetupId: uuid("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    // Nullable: a exclusão de conta mantém o comentário sem o autor.
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    // Nullable: o comentário apagado pela tela perde o texto e fica só o registro.
    body: text("body"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // char_length conta caracteres, não bytes: emoji vale 1.
    check("meetup_comments_body_max_500", sql`char_length(${table.body}) <= 500`),
    index("meetup_comments_meetup_id_created_at_idx").on(table.meetupId, table.createdAt),
    index("meetup_comments_author_id_created_at_idx").on(table.authorId, table.createdAt),
  ],
);

// Contagens por encontro para o critério do piloto: sobrevivem ao apagamento de 30 dias
// e não guardam quem comentou.
export const meetupCommentStats = pgTable("meetup_comment_stats", {
  meetupId: uuid("meetup_id")
    .primaryKey()
    .references(() => meetups.id, { onDelete: "cascade" }),
  commentCount: integer("comment_count").notNull().default(0),
  distinctAuthors: integer("distinct_authors").notNull().default(0),
});
