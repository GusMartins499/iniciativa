import { eq } from "drizzle-orm";
import { cancelFutureByCreator, detachCreator } from "@/modules/meetups";
import { removeAllByUser } from "@/modules/rsvps";
import { deleteAuthUser } from "@/shared/auth";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { reportError } from "@/shared/observability";
import { ok, type Result } from "@/shared/result";
import { userOnboardings } from "./schema";

type DeletedCounts = { cancelledMeetups: number; releasedRsvps: number };

// Direito de exclusão (LGPD): tudo numa transação só: ou a pessoa sai por inteiro,
// ou nada muda. Hard delete: não fica cópia de PII no app.
export async function deleteAccount(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<Result<DeletedCounts, never>> {
  try {
    const counts = await db.transaction(async (tx) => {
      const cancelledMeetups = await cancelFutureByCreator(tx, userId, now);
      const releasedRsvps = await removeAllByUser(tx, userId, now);
      await detachCreator(tx, userId);
      await tx.delete(userOnboardings).where(eq(userOnboardings.userId, userId));
      await deleteAuthUser(tx, userId);
      return { cancelledMeetups, releasedRsvps };
    });
    logger.info({ event: "user.deleted", userId, ...counts });
    return ok(counts);
  } catch (error) {
    reportError(error, { event: "user.delete_failed", userId });
    throw error;
  }
}
