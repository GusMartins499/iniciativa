import { inArray } from "drizzle-orm";
import { listEndedBefore } from "@/modules/meetups";
import type { Database } from "@/shared/db";
import { meetupComments } from "./schema";

const RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Promessa do termo v2: 30 dias depois do fim do encontro, os comentários saem do banco.
// O fim vem de meetups a cada execução, então editar o encontro muda o corte.
export async function purgeExpiredComments(db: Database, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * DAY_MS);
  const meetupIds = await listEndedBefore(db, cutoff);
  if (meetupIds.length === 0) return 0;
  const deleted = await db
    .delete(meetupComments)
    .where(inArray(meetupComments.meetupId, meetupIds))
    .returning({ id: meetupComments.id });
  return deleted.length;
}
