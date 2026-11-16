import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { getMeetup } from "@/modules/meetups";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { cancelRsvp, confirmRsvp, listAttendeesForCreator } from "./rsvps";
import { rsvps } from "./schema";
import { AFTER_START, NOW, setupMeetup } from "./test-setup";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function occupied(meetupId: string) {
  const r = await getMeetup(db, meetupId);
  if (!r.ok) throw new Error("encontro sumiu");
  return r.data.occupiedSeats;
}

describe("rsvps.confirmRsvp", () => {
  it("confirma sem acompanhante e ocupa 1 vaga", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");

    const r = await confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW);

    expect(r.ok).toBe(true);
    expect(await occupied(meetupId)).toBe(2);
  });

  it("confirma com acompanhante e ocupa 2 vagas", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");

    await confirmRsvp(db, userB, meetupId, { withCompanion: true }, NOW);

    expect(await occupied(meetupId)).toBe(3);
  });

  it("bloqueia acompanhante quando só resta 1 vaga, mas aceita sozinho", async () => {
    const { meetupId } = await setupMeetup(db, 3);
    await confirmRsvp(
      db,
      await insertTestUser(db, "user-a"),
      meetupId,
      { withCompanion: false },
      NOW,
    );
    const userB = await insertTestUser(db, "user-b");

    const withCompanion = await confirmRsvp(db, userB, meetupId, { withCompanion: true }, NOW);
    const alone = await confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW);

    expect(withCompanion).toEqual({ ok: false, error: { code: "MEETUP_FULL" } });
    expect(alone.ok).toBe(true);
    expect(await occupied(meetupId)).toBe(3);
  });

  it("bloqueia quando o encontro está lotado", async () => {
    const { meetupId } = await setupMeetup(db, 2);
    await confirmRsvp(
      db,
      await insertTestUser(db, "user-a"),
      meetupId,
      { withCompanion: false },
      NOW,
    );

    const r = await confirmRsvp(
      db,
      await insertTestUser(db, "user-b"),
      meetupId,
      { withCompanion: false },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_FULL" } });
  });

  it("é idempotente: confirmar de novo não ocupa vaga extra", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");

    const r1 = await confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW);
    const r2 = await confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW);

    expect(r1.ok && r2.ok && r2.data.rsvpId === r1.data.rsvpId).toBe(true);
    expect(await occupied(meetupId)).toBe(2);
  });

  it("bloqueia depois do início do encontro", async () => {
    const { meetupId } = await setupMeetup(db, 10);

    const r = await confirmRsvp(
      db,
      await insertTestUser(db, "user-b"),
      meetupId,
      { withCompanion: false },
      AFTER_START,
    );

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_STARTED" } });
  });

  it("trata o criador como já confirmado, sem ocupar vaga extra", async () => {
    const { creatorId, meetupId } = await setupMeetup(db, 10);

    const r = await confirmRsvp(db, creatorId, meetupId, { withCompanion: false }, NOW);

    expect(r).toEqual({ ok: true, data: { rsvpId: null } });
    expect(await occupied(meetupId)).toBe(1);
  });

  it("devolve NOT_FOUND para encontro inexistente", async () => {
    const userB = await insertTestUser(db, "user-b");

    const r = await confirmRsvp(
      db,
      userB,
      "00000000-0000-0000-0000-000000000000",
      { withCompanion: false },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });
});

describe("rsvps.cancelRsvp", () => {
  it("libera a vaga da pessoa e do acompanhante", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");
    await confirmRsvp(db, userB, meetupId, { withCompanion: true }, NOW);

    const r = await cancelRsvp(db, userB, meetupId, NOW);

    expect(r.ok).toBe(true);
    expect(await occupied(meetupId)).toBe(1);
    expect(await db.select().from(rsvps).where(eq(rsvps.userId, userB))).toHaveLength(0);
  });

  it("bloqueia depois do início do encontro", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");
    await confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW);

    const r = await cancelRsvp(db, userB, meetupId, AFTER_START);

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_STARTED" } });
    expect(await occupied(meetupId)).toBe(2);
  });

  it("impede o criador de cancelar a própria presença", async () => {
    const { creatorId, meetupId } = await setupMeetup(db, 10);

    const r = await cancelRsvp(db, creatorId, meetupId, NOW);

    expect(r).toEqual({ ok: false, error: { code: "CREATOR_CANNOT_LEAVE" } });
  });
});

describe("rsvps.listAttendeesForCreator", () => {
  it("devolve primeiro nome e acompanhante para o criador", async () => {
    const { creatorId, meetupId } = await setupMeetup(db, 10);
    const ana = await insertTestUser(db, "ana", "Ana Souza");
    await confirmRsvp(db, ana, meetupId, { withCompanion: true }, NOW);

    const r = await listAttendeesForCreator(db, creatorId, meetupId);

    expect(r).toEqual({ ok: true, data: [{ firstName: "Ana", withCompanion: true }] });
  });

  it("recusa quem não é o criador", async () => {
    const { meetupId } = await setupMeetup(db, 10);
    const userB = await insertTestUser(db, "user-b");

    const r = await listAttendeesForCreator(db, userB, meetupId);

    expect(r).toEqual({ ok: false, error: { code: "NOT_MEETUP_CREATOR" } });
  });
});
