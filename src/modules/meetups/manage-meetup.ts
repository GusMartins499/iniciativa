import { eq } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { meetups } from "./schema";
import { lockMeetupForUpdate } from "./seats";
import { validateMeetupFields } from "./validate-meetup";

type UpdateError =
  | "NOT_FOUND"
  | "NOT_MEETUP_CREATOR"
  | "MEETUP_STARTED"
  | "MEETUP_CANCELLED"
  | "VALIDATION_FAILED"
  | "CAPACITY_BELOW_OCCUPIED";

type CancelError = "NOT_FOUND" | "NOT_MEETUP_CREATOR" | "MEETUP_STARTED";

// A edição não muda o acompanhante do criador (fora do escopo do MVP): a ocupação
// mínima é a atual, conferida com a linha travada contra confirmações simultâneas.
export async function updateMeetup(
  db: Database,
  userId: string,
  meetupId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<Result<void, UpdateError>> {
  const result = await db.transaction(async (tx): Promise<Result<void, UpdateError>> => {
    const locked = await lockMeetupForUpdate(tx, meetupId);
    if (!locked.ok) return locked;
    if (locked.data.creatorId !== userId) return err("NOT_MEETUP_CREATOR");
    if (locked.data.startsAt <= now) return err("MEETUP_STARTED");
    if (locked.data.status === "cancelled") return err("MEETUP_CANCELLED");

    const validated = validateMeetupFields(input, now, () => locked.data.occupiedSeats);
    if (!validated.ok) return validated;
    const { data, startsAt, endsAt } = validated.data;

    await tx
      .update(meetups)
      .set({
        title: data.title,
        address: data.address,
        placeDescription: data.placeDescription ?? null,
        startsAt,
        endsAt,
        capacity: data.capacity,
        editedAt: now,
      })
      .where(eq(meetups.id, meetupId));
    return ok(undefined);
  });

  if (!result.ok) {
    logger.warn({ event: "meetup.update_rejected", userId, meetupId, code: result.error.code });
    return result;
  }
  logger.info({ event: "meetup.updated", userId, meetupId });
  return result;
}

// Os RSVPs continuam existindo: quem confirmou vê o aviso de cancelado.
export async function cancelMeetup(
  db: Database,
  userId: string,
  meetupId: string,
  now: Date = new Date(),
): Promise<Result<void, CancelError>> {
  const result = await db.transaction(
    async (tx): Promise<Result<{ changed: boolean }, CancelError>> => {
      const locked = await lockMeetupForUpdate(tx, meetupId);
      if (!locked.ok) return locked;
      if (locked.data.creatorId !== userId) return err("NOT_MEETUP_CREATOR");
      if (locked.data.status === "cancelled") return ok({ changed: false });
      if (locked.data.startsAt <= now) return err("MEETUP_STARTED");

      await tx.update(meetups).set({ status: "cancelled" }).where(eq(meetups.id, meetupId));
      return ok({ changed: true });
    },
  );

  if (!result.ok) {
    logger.warn({ event: "meetup.update_rejected", userId, meetupId, code: result.error.code });
    return result;
  }
  if (result.data.changed) {
    logger.info({ event: "meetup.cancelled", userId, meetupId });
  }
  return ok(undefined);
}
