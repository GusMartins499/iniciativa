import { eq } from "drizzle-orm";
import { anonymizeCommentsByAuthor } from "@/modules/comments";
import { removeAllMemberships } from "@/modules/communities";
import { cancelFutureByCreator, detachCreator } from "@/modules/meetups";
import { removeAllByUser } from "@/modules/rsvps";
import { deleteAuthUser } from "@/shared/auth";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { reportError } from "@/shared/observability";
import { ok, type Result } from "@/shared/result";
import { userOnboardings } from "./schema";

type DeletedCounts = {
  cancelledMeetups: number;
  releasedRsvps: number;
  removedMemberships: number;
  anonymizedComments: number;
};

// Direito de exclusão (LGPD): tudo numa transação só: ou a pessoa sai por inteiro,
// ou nada muda. Hard delete: não fica cópia de PII no app.
export async function deleteAccount(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<Result<DeletedCounts, never>> {
  try {
    const { comments, ...counts } = await db.transaction(async (tx) => {
      const cancelledMeetups = await cancelFutureByCreator(tx, userId, now);
      const releasedRsvps = await removeAllByUser(tx, userId, now);
      const removedMemberships = await removeAllMemberships(tx, userId);
      // Antes de apagar o usuário: o texto sai junto, e não só o autor (FK set null).
      const anonymized = await anonymizeCommentsByAuthor(tx, userId, now);
      await detachCreator(tx, userId);
      await tx.delete(userOnboardings).where(eq(userOnboardings.userId, userId));
      await deleteAuthUser(tx, userId);
      return {
        cancelledMeetups,
        releasedRsvps,
        removedMemberships,
        anonymizedComments: anonymized.length,
        comments: anonymized,
      };
    });
    for (const { commentId, meetupId } of comments) {
      logger.info({ event: "comment.deleted", commentId, meetupId, by: "account_deletion" });
    }
    logger.info({ event: "user.deleted", userId, ...counts });
    return ok(counts);
  } catch (error) {
    reportError(error, { event: "user.delete_failed", userId });
    throw error;
  }
}
