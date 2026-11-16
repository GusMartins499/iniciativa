import type { Database } from "@/shared/db";
import { user } from "@/shared/auth/schema";

// Dados sintéticos — nunca de pessoas reais (GUIDELINES.md § Security).
export async function insertTestUser(db: Database, id = "user-test-1", name = "Pessoa Teste") {
  await db.insert(user).values({
    id,
    name,
    email: `${id}@exemplo.test`,
  });
  return id;
}
