import { eq } from "drizzle-orm";
import { confirmRsvp } from "@/modules/rsvps";
import { createMeetup, getMeetup } from "@/modules/meetups";
import { session, user } from "@/shared/auth/schema";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { completeOnboarding } from "./complete-onboarding";
import { userOnboardings } from "./schema";

export const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
export const NOW = new Date("2026-11-20T12:00:00.000Z");

function meetupInput(day: string, capacity = 10, withCompanion = false) {
  return {
    title: "Café",
    startsAt: `${day}T15:00`,
    endsAt: `${day}T17:00`,
    address: "Rua X, 100",
    capacity,
    publicPlace: true,
    audience: "open",
    withCompanion,
  };
}

// Pessoa que vai excluir a conta: com autodeclaração, sessão, um encontro passado
// e um futuro criados por ela, e presença com acompanhante no encontro de outra pessoa.
export async function setupAccount(db: Database) {
  const userId = await insertTestUser(db, "leaving");
  await completeOnboarding(db, userId, { declaration: true, consent: true });
  await db.insert(session).values({
    id: "session-1",
    token: "synthetic-session",
    userId,
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  });

  const past = await createMeetup(db, userId, meetupInput("2026-11-10"), CREATED_AT);
  const future = await createMeetup(db, userId, meetupInput("2026-12-05"), CREATED_AT);
  const otherCreator = await insertTestUser(db, "other-creator");
  // Outro encontro com 5 ocupadas: o criador (2, com acompanhante) + 1 + esta pessoa (2).
  const other = await createMeetup(
    db,
    otherCreator,
    meetupInput("2026-12-06", 10, true),
    CREATED_AT,
  );
  if (!past.ok || !future.ok || !other.ok) throw new Error("falha ao criar encontros");
  await confirmRsvp(
    db,
    await insertTestUser(db, "someone"),
    other.data.id,
    { withCompanion: false },
    CREATED_AT,
  );
  await confirmRsvp(db, userId, other.data.id, { withCompanion: true }, CREATED_AT);

  return { userId, pastId: past.data.id, futureId: future.data.id, otherId: other.data.id };
}

export async function snapshot(
  db: Database,
  ids: { userId: string; pastId: string; futureId: string; otherId: string },
) {
  const meetup = async (id: string) => {
    const r = await getMeetup(db, id);
    if (!r.ok) return null;
    return { status: r.data.status, occupiedSeats: r.data.occupiedSeats };
  };
  return {
    users: await db.select({ id: user.id }).from(user).where(eq(user.id, ids.userId)),
    onboardings: await db
      .select()
      .from(userOnboardings)
      .where(eq(userOnboardings.userId, ids.userId)),
    sessions: await db
      .select({ id: session.id })
      .from(session)
      .where(eq(session.userId, ids.userId)),
    past: await meetup(ids.pastId),
    future: await meetup(ids.futureId),
    other: await meetup(ids.otherId),
  };
}
