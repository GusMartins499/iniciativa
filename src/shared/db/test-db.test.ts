import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createTestDb } from "./test-db";

describe("shared/db (harness de teste)", () => {
  it("sobe um Postgres PGlite em memória e executa uma consulta", async () => {
    const db = await createTestDb();
    const r = await db.execute<{ n: number }>(sql`select 1 as n`);
    expect(r.rows[0]?.n).toBe(1);
  });
});
