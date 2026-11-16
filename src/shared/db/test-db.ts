import { PGlite } from "@electric-sql/pglite";
import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
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

// Postgres real (branch de teste do Neon) para os testes que precisam de várias conexões.
export async function createNeonTestDb(
  url: string,
): Promise<{ db: Database; close: () => Promise<void> }> {
  const pool = new Pool({ connectionString: url });
  const db = drizzleNeon({ client: pool });
  // A branch de teste é descartável: recria o schema e aplica todas as migrações do zero,
  // assim ela nunca fica atrás do drizzle/ nem depende do histórico copiado de outra branch.
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("CREATE SCHEMA public");
  await migrateNeon(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => pool.end() };
}
