import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as schema from "./schema";

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../drizzle", import.meta.url));

export async function createTestDb() {
  const db = drizzle({ client: new PGlite(), schema });
  // Sem migração gerada ainda, não há journal para aplicar.
  if (existsSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`)) {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  }
  return db;
}
