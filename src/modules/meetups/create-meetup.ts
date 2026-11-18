import { listMemberSlugs } from "@/modules/communities";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { OPEN_AUDIENCE } from "./meetup-input";
import { meetups } from "./schema";
import { validateMeetupFields } from "./validate-meetup";

type Meetup = typeof meetups.$inferSelect;
type CreateError = "VALIDATION_FAILED" | "CAPACITY_BELOW_OCCUPIED" | "NOT_COMMUNITY_MEMBER";

export async function createMeetup(
  db: Database,
  userId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<Result<Meetup, CreateError>> {
  const reject = (code: CreateError, communitySlug?: string) => {
    logger.warn({ event: "meetup.create_rejected", userId, communitySlug, code });
    return err(code);
  };

  // O criador entra confirmado: ocupa 1 vaga, ou 2 com acompanhante.
  const validated = validateMeetupFields(input, now, (data) => (data.withCompanion ? 2 : 1));
  if (!validated.ok) {
    return reject(validated.error.code);
  }
  const { data, startsAt, endsAt, occupiedSeats } = validated.data;
  const communitySlug = data.audience === OPEN_AUDIENCE ? null : data.audience;
  // O formulário só oferece as comunidades da pessoa, mas a requisição pode ser forjada.
  if (communitySlug && !(await listMemberSlugs(db, userId)).includes(communitySlug)) {
    return reject("NOT_COMMUNITY_MEMBER", communitySlug);
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
      communitySlug,
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
    audience: data.audience,
  });
  return ok(meetup);
}
