import { neon } from "@neondatabase/serverless";
import { pendingMigrations, readJournal } from "./pending-migrations";

// Roda no deploy (.github/workflows/deploy.yml), depois do drizzle-kit migrate e antes de
// publicar: falha se alguma migração do drizzle/ não chegou ao banco do ambiente. Fica fora do
// app, por isso lê o DATABASE_URL direto, como o drizzle.config.ts.
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definido.");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`select max(created_at)::text as last from drizzle.__drizzle_migrations`;
const last = rows[0]?.last;
const pending = pendingMigrations(readJournal(), typeof last === "string" ? Number(last) : null);

if (pending.length > 0) {
  console.error(`Migrações pendentes no banco: ${pending.join(", ")}`);
  process.exit(1);
}
console.log("Nenhuma migração pendente.");
