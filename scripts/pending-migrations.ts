import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const journalSchema = z.object({
  entries: z.array(z.object({ tag: z.string(), when: z.number() })),
});

export type Journal = z.infer<typeof journalSchema>;

export function readJournal(): Journal {
  const path = fileURLToPath(new URL("../drizzle/meta/_journal.json", import.meta.url));
  return journalSchema.parse(JSON.parse(readFileSync(path, "utf8")));
}

// Mesma regra do drizzle-kit migrate: aplica as migrações criadas depois da última que o banco
// registrou em drizzle.__drizzle_migrations. Banco sem registro (null) tem todas pendentes.
export function pendingMigrations(journal: Journal, lastAppliedAt: number | null): string[] {
  return journal.entries
    .filter((entry) => lastAppliedAt === null || entry.when > lastAppliedAt)
    .map((entry) => entry.tag);
}
