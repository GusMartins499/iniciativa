import { and, eq, gt } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { meetups } from "./schema";

// Exclusão de conta (orquestrada por users, na mesma transação): os encontros
// futuros de quem sai são cancelados e todos perdem a referência ao criador.

export async function cancelFutureByCreator(
  tx: Database,
  userId: string,
  now: Date,
): Promise<number> {
  const cancelled = await tx
    .update(meetups)
    .set({ status: "cancelled" })
    .where(
      and(eq(meetups.creatorId, userId), gt(meetups.startsAt, now), eq(meetups.status, "active")),
    )
    .returning({ id: meetups.id });
  return cancelled.length;
}

export async function detachCreator(tx: Database, userId: string): Promise<void> {
  await tx.update(meetups).set({ creatorId: null }).where(eq(meetups.creatorId, userId));
}
