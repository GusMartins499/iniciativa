import { inArray } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { user } from "./schema";

// Só o primeiro nome sai daqui: a lista de confirmados nunca expõe nome completo nem e-mail.
export async function getFirstNames(db: Database, userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, userIds));
  return new Map(rows.map((row) => [row.id, row.name.trim().split(/\s+/)[0] ?? ""]));
}
