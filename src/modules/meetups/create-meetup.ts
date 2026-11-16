import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { fromAppTime } from "@/shared/time";
import { meetupInputSchema } from "./meetup-input";
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

  const parsed = meetupInputSchema.safeParse(input);
  if (!parsed.success) {
    return reject("VALIDATION_FAILED");
  }
  const data = parsed.data;
  const startsAt = fromAppTime(data.startsAt);
  const endsAt = fromAppTime(data.endsAt);
  if (endsAt <= startsAt || startsAt <= now) {
    return reject("VALIDATION_FAILED");
  }

  // O criador entra confirmado: ocupa 1 vaga, ou 2 com acompanhante.
  const occupiedSeats = data.withCompanion ? 2 : 1;
  if (data.capacity < occupiedSeats) {
    return reject("CAPACITY_BELOW_OCCUPIED");
  }

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
