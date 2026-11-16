import { eq, inArray } from "drizzle-orm";
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

// Apaga o usuário dentro da transação de quem chama; sessões e contas do Google
// saem em cascata. ❌ Não usar o deleteUser do Better Auth: ele abre outra conexão.
export async function deleteAuthUser(tx: Database, userId: string): Promise<void> {
  await tx.delete(user).where(eq(user.id, userId));
}
