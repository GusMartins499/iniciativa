import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinCommunity, leaveCommunity } from "@/modules/communities";
import { cancelMeetup, getMeetup } from "@/modules/meetups";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
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

  it("bloqueia confirmar presença em encontro cancelado", async () => {
    const { creatorId, meetupId } = await setupMeetup(db, 10);
    await cancelMeetup(db, creatorId, meetupId, NOW);

    const r = await confirmRsvp(
      db,
      await insertTestUser(db, "user-b"),
      meetupId,
      { withCompanion: false },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_CANCELLED" } });
  });

  it("mantém os RSVPs quando o encontro é cancelado", async () => {
    const { creatorId, meetupId } = await setupMeetup(db, 10);
    await confirmRsvp(
      db,
      await insertTestUser(db, "user-a"),
      meetupId,
      { withCompanion: false },
      NOW,
    );
    await confirmRsvp(
      db,
      await insertTestUser(db, "user-b"),
      meetupId,
      { withCompanion: false },
      NOW,
    );

    await cancelMeetup(db, creatorId, meetupId, NOW);

    expect(await db.select().from(rsvps).where(eq(rsvps.meetupId, meetupId))).toHaveLength(2);
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
    const attendeeId = await insertTestUser(db, "ana", "Ana Souza");
    await confirmRsvp(db, attendeeId, meetupId, { withCompanion: true }, NOW);

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

describe("rsvps em encontro de comunidade", () => {
  it("membro da comunidade confirma presença", async () => {
    const { meetupId } = await setupMeetup(db, 10, "", "rpg");
    const member = await insertTestUser(db, "member");
    await joinCommunity(db, member, "rpg");

    const r = await confirmRsvp(db, member, meetupId, { withCompanion: false }, NOW);

    expect(r.ok).toBe(true);
    expect(await occupied(meetupId)).toBe(2);
  });

  it("recusa a confirmação de quem não é membro, sem ocupar vaga, e loga warn sem PII", async () => {
    const { meetupId } = await setupMeetup(db, 10, "", "rpg");
    const outsider = await insertTestUser(db, "outsider");
    const warn = vi.spyOn(logger, "warn");

    const r = await confirmRsvp(db, outsider, meetupId, { withCompanion: false }, NOW);

    expect(r).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
    expect(await occupied(meetupId)).toBe(1);
    expect(warn).toHaveBeenCalledWith({
      event: "rsvp.rejected",
      userId: outsider,
      meetupId,
      communitySlug: "rpg",
      code: "NOT_COMMUNITY_MEMBER",
    });
  });

  it("recusa o cancelamento de quem não é membro", async () => {
    const { meetupId } = await setupMeetup(db, 10, "", "rpg");
    const outsider = await insertTestUser(db, "outsider");

    const r = await cancelRsvp(db, outsider, meetupId, NOW);

    expect(r).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("quem saiu da comunidade depois de confirmar ainda pode cancelar a presença", async () => {
    const { meetupId } = await setupMeetup(db, 10, "", "rpg");
    const member = await insertTestUser(db, "member");
    await joinCommunity(db, member, "rpg");
    await confirmRsvp(db, member, meetupId, { withCompanion: true }, NOW);
    await leaveCommunity(db, member, "rpg");

    const r = await cancelRsvp(db, member, meetupId, NOW);

    expect(r.ok).toBe(true);
    expect(await occupied(meetupId)).toBe(1);
  });

  it("quem saiu da comunidade depois de confirmar não confirma de novo depois de cancelar", async () => {
    const { meetupId } = await setupMeetup(db, 10, "", "rpg");
    const member = await insertTestUser(db, "member");
    await joinCommunity(db, member, "rpg");
    await confirmRsvp(db, member, meetupId, { withCompanion: false }, NOW);
    await leaveCommunity(db, member, "rpg");
    await cancelRsvp(db, member, meetupId, NOW);

    const r = await confirmRsvp(db, member, meetupId, { withCompanion: false }, NOW);

    expect(r).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
