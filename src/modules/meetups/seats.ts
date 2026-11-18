import { and, eq, gt, sql } from "drizzle-orm";
import type { CommunitySlug } from "@/modules/communities";
import type { Database } from "@/shared/db";
import { err, ok, type Result } from "@/shared/result";
import { meetups } from "./schema";

export type LockedMeetup = {
  creatorId: string | null;
  startsAt: Date;
  status: "active" | "cancelled";
  occupiedSeats: number;
  communitySlug: CommunitySlug | null;
};

// Trava a linha do encontro até o fim da transação: confirmações e cancelamentos
// simultâneos no mesmo encontro passam a rodar em fila.
export async function lockMeetupForUpdate(
  tx: Database,
  meetupId: string,
): Promise<Result<LockedMeetup, "NOT_FOUND">> {
  const [row] = await tx
    .select({
      creatorId: meetups.creatorId,
      startsAt: meetups.startsAt,
      status: meetups.status,
      occupiedSeats: meetups.occupiedSeats,
      communitySlug: meetups.communitySlug,
    })
    .from(meetups)
    .where(eq(meetups.id, meetupId))
    .for("update");
  return row ? ok(row) : err("NOT_FOUND");
}

// Incrementa só se couber e se o encontro está ativo e ainda não começou; a checagem e a escrita
// são a mesma instrução, dentro da transação que já trava a linha.
export async function reserveSeats(
  tx: Database,
  meetupId: string,
  seats: number,
  now: Date,
): Promise<Result<void, "MEETUP_FULL">> {
  const updated = await tx
    .update(meetups)
    .set({ occupiedSeats: sql`${meetups.occupiedSeats} + ${seats}` })
    .where(
      and(
        eq(meetups.id, meetupId),
        eq(meetups.status, "active"),
        gt(meetups.startsAt, now),
        sql`${meetups.occupiedSeats} + ${seats} <= ${meetups.capacity}`,
      ),
    )
    .returning({ id: meetups.id });
  return updated.length > 0 ? ok(undefined) : err("MEETUP_FULL");
}

export async function releaseSeats(tx: Database, meetupId: string, seats: number): Promise<void> {
  await tx
    .update(meetups)
    .set({ occupiedSeats: sql`${meetups.occupiedSeats} - ${seats}` })
    .where(eq(meetups.id, meetupId));
}

export async function getCreatorId(db: Database, meetupId: string): Promise<string | null> {
  const [row] = await db
    .select({ creatorId: meetups.creatorId })
    .from(meetups)
    .where(eq(meetups.id, meetupId))
    .limit(1);
  return row?.creatorId ?? null;
}
