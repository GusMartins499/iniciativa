import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Database } from "./types";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../drizzle", import.meta.url));

export async function createTestDb(): Promise<Database> {
  const db = drizzle({ client: new PGlite() });
  // Sem migração gerada ainda, não há journal para aplicar.
  if (existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  }
  return db;
}
