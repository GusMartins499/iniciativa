import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

// Tipo comum ao cliente do Neon (produção) e ao PGlite (testes).
export type Database = PgDatabase<PgQueryResultHKT>;
