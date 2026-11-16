import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { validateMeetupFields } from "./validate-meetup";
import { meetups } from "./schema";

type Meetup = typeof meetups.$inferSelect;

export async function createMeetup(
  db: Database,
  userId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<Result<Meetup, "VALIDATION_FAILED" | "CAPACITY_BELOW_OCCUPIED">> {
  const reject = (code: "VALIDATION_FAILED" | "CAPACITY_BELOW_OCCUPIED") => {
    logger.warn({ event: "meetup.create_rejected", userId, code });
    return err(code);
  };

  // O criador entra confirmado: ocupa 1 vaga, ou 2 com acompanhante.
  const validated = validateMeetupFields(input, now, (data) => (data.withCompanion ? 2 : 1));
  if (!validated.ok) {
    return reject(validated.error.code);
  }
  const { data, startsAt, endsAt, occupiedSeats } = validated.data;

  const [meetup] = await db
    .insert(meetups)
    .values({
      creatorId: userId,
      title: data.title,
      address: data.address,
      placeDescription: data.placeDescription ?? null,
      startsAt,
      endsAt,
      capacity: data.capacity,
      occupiedSeats,
      creatorWithCompanion: data.withCompanion,
    })
    .returning();
  if (!meetup) {
    throw new Error("insert de encontro não devolveu linha");
  }

  logger.info({
    event: "meetup.created",
    userId,
    meetupId: meetup.id,
    withCompanion: data.withCompanion,
  });
  return ok(meetup);
}
