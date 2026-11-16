import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/shared/auth/schema";

// Autodeclaração e consentimento LGPD (dado sensível de saúde).
export const userOnboardings = pgTable("user_onboardings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  declaredAutismLevel1OrAutonomous: boolean("declared_autism_level1_or_autonomous").notNull(),
  declaredAdult: boolean("declared_adult").notNull(),
  consentVersion: text("consent_version").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
});
