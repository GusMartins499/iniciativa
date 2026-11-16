import { and, asc, eq } from "drizzle-orm";
import { getCreatorId, lockMeetupForUpdate, releaseSeats, reserveSeats } from "@/modules/meetups";
import { getFirstNames } from "@/shared/auth";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { confirmRsvpSchema } from "./confirm-schema";
import { rsvps } from "./schema";

type ConfirmError =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "MEETUP_STARTED"
  | "MEETUP_CANCELLED"
  | "MEETUP_FULL";
type CancelError = "NOT_FOUND" | "MEETUP_STARTED" | "CREATOR_CANNOT_LEAVE";

function seatsFor(withCompanion: boolean): number {
  return withCompanion ? 2 : 1;
}

function rejected<C extends string>(code: C, userId: string, meetupId: string) {
  logger.warn({ event: "rsvp.rejected", userId, meetupId, code });
  return err(code);
}

// rsvpId é null para o criador, que já entra confirmado ao criar o encontro.
export async function confirmRsvp(
  db: Database,
  userId: string,
  meetupId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<Result<{ rsvpId: string | null }, ConfirmError>> {
  const parsed = confirmRsvpSchema.safeParse(input);
  if (!parsed.success) return rejected("VALIDATION_FAILED", userId, meetupId);
  const { withCompanion } = parsed.data;

  const result = await db.transaction(
    async (tx): Promise<Result<{ rsvpId: string | null; created: boolean }, ConfirmError>> => {
      const locked = await lockMeetupForUpdate(tx, meetupId);
      if (!locked.ok) return locked;
      if (locked.data.status === "cancelled") return err("MEETUP_CANCELLED");
      if (locked.data.creatorId === userId) return ok({ rsvpId: null, created: false });
      if (locked.data.startsAt <= now) return err("MEETUP_STARTED");

      const [existing] = await tx
        .select({ id: rsvps.id })
        .from(rsvps)
        .where(and(eq(rsvps.meetupId, meetupId), eq(rsvps.userId, userId)));
      if (existing) return ok({ rsvpId: existing.id, created: false });

      const reserved = await reserveSeats(tx, meetupId, seatsFor(withCompanion), now);
      if (!reserved.ok) return reserved;

      const [rsvp] = await tx
        .insert(rsvps)
        .values({ meetupId, userId, withCompanion })
        .returning({ id: rsvps.id });
      if (!rsvp) throw new Error("insert de RSVP não devolveu linha");
      return ok({ rsvpId: rsvp.id, created: true });
    },
  );

  if (!result.ok) return rejected(result.error.code, userId, meetupId);
  if (result.data.created) {
    logger.info({
      event: "rsvp.confirmed",
      userId,
      meetupId,
      rsvpId: result.data.rsvpId,
      withCompanion,
    });
  }
  return ok({ rsvpId: result.data.rsvpId });
}

export async function cancelRsvp(
  db: Database,
  userId: string,
  meetupId: string,
  now: Date = new Date(),
): Promise<Result<void, CancelError>> {
  const result = await db.transaction(async (tx): Promise<Result<string | null, CancelError>> => {
    const locked = await lockMeetupForUpdate(tx, meetupId);
    if (!locked.ok) return locked;
    if (locked.data.creatorId === userId) return err("CREATOR_CANNOT_LEAVE");
    if (locked.data.startsAt <= now) return err("MEETUP_STARTED");

    const [removed] = await tx
      .delete(rsvps)
      .where(and(eq(rsvps.meetupId, meetupId), eq(rsvps.userId, userId)))
      .returning({ id: rsvps.id, withCompanion: rsvps.withCompanion });
    // Sem RSVP: cancelar de novo não muda nada.
    if (!removed) return ok(null);
    await releaseSeats(tx, meetupId, seatsFor(removed.withCompanion));
    return ok(removed.id);
  });

  if (!result.ok) return rejected(result.error.code, userId, meetupId);
  if (result.data) {
    logger.info({ event: "rsvp.cancelled", userId, meetupId, rsvpId: result.data });
  }
  return ok(undefined);
}

export async function getUserRsvp(
  db: Database,
  userId: string,
  meetupId: string,
): Promise<{ withCompanion: boolean } | null> {
  const [row] = await db
    .select({ withCompanion: rsvps.withCompanion })
    .from(rsvps)
    .where(and(eq(rsvps.meetupId, meetupId), eq(rsvps.userId, userId)));
  return row ?? null;
}

// Nomes só para o criador, conferido no servidor antes de qualquer leitura.
export async function listAttendeesForCreator(
  db: Database,
  requesterId: string,
  meetupId: string,
): Promise<Result<{ firstName: string; withCompanion: boolean }[], "NOT_MEETUP_CREATOR">> {
  if ((await getCreatorId(db, meetupId)) !== requesterId) {
    return err("NOT_MEETUP_CREATOR");
  }
  const rows = await db
    .select({ userId: rsvps.userId, withCompanion: rsvps.withCompanion })
    .from(rsvps)
    .where(eq(rsvps.meetupId, meetupId))
    .orderBy(asc(rsvps.createdAt));
  const names = await getFirstNames(
    db,
    rows.map((row) => row.userId),
  );
  return ok(
    rows.map((row) => ({
      firstName: names.get(row.userId) ?? "",
      withCompanion: row.withCompanion,
    })),
  );
}
