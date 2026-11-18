import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, like } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { meetupComments } from "@/modules/comments/schema";
import { COMMUNITIES } from "@/modules/communities/list";
import { communityMemberships } from "@/modules/communities/schema";
import { meetups } from "@/modules/meetups/schema";
import { rsvps } from "@/modules/rsvps/schema";
import { user } from "@/shared/auth/schema";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
import { runSeed, SEED_EMAIL_DOMAIN, seedSummary } from "./run-seed";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function seedUserIds(): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `%${SEED_EMAIL_DOMAIN}`));
  return rows.map((row) => row.id);
}

async function seedMeetups() {
  return db
    .select()
    .from(meetups)
    .where(inArray(meetups.creatorId, await seedUserIds()));
}

async function memberships() {
  return db
    .select()
    .from(communityMemberships)
    .where(inArray(communityMemberships.userId, await seedUserIds()));
}

async function commentsOf(meetupId: string) {
  return db.select().from(meetupComments).where(eq(meetupComments.meetupId, meetupId));
}

describe("seed", () => {
  it("roda do zero e de novo sem erro, apagando só o que é do seed", async () => {
    const outsiderId = randomUUID();
    await db.insert(user).values({
      id: outsiderId,
      name: "Fora Teste",
      email: "fora@outro.test",
      emailVerified: true,
    });

    const first = await runSeed(db);
    const second = await runSeed(db);

    expect(second).toEqual(first);
    expect(await seedUserIds()).toHaveLength(first.people);
    expect(await seedMeetups()).toHaveLength(first.meetups);
    expect(await memberships()).toHaveLength(first.memberships);
    const [outsider] = await db.select().from(user).where(eq(user.id, outsiderId));
    expect(outsider?.email).toBe("fora@outro.test");
  });

  it("cada pessoa participa de 0 a 3 comunidades, e pelo menos uma de nenhuma", async () => {
    await runSeed(db);
    const ids = await seedUserIds();
    const rows = await memberships();
    const perPerson = ids.map((id) => rows.filter((row) => row.userId === id).length);

    expect(perPerson.every((total) => total >= 0 && total <= 3)).toBe(true);
    expect(perPerson).toContain(0);
    const known = new Set<string>(COMMUNITIES.map((c) => c.slug));
    expect(rows.every((row) => known.has(row.communitySlug))).toBe(true);
  });

  it("pelo menos duas comunidades ficam com membros e pelo menos uma vazia", async () => {
    await runSeed(db);
    const withMembers = new Set((await memberships()).map((row) => row.communitySlug));

    expect(withMembers.size).toBeGreaterThanOrEqual(2);
    expect(COMMUNITIES.some((c) => !withMembers.has(c.slug))).toBe(true);
  });

  it("encontros de comunidade são criados por membros, e um tem presença de outro membro", async () => {
    await runSeed(db);
    const rows = await memberships();
    const isMember = (userId: string | null, slug: string) =>
      rows.some((row) => row.userId === userId && row.communitySlug === slug);
    const ofCommunity = (await seedMeetups()).filter((m) => m.communitySlug !== null);

    expect(ofCommunity.length).toBeGreaterThanOrEqual(2);
    expect(ofCommunity.every((m) => isMember(m.creatorId, m.communitySlug!))).toBe(true);

    const confirmed = await db
      .select({ userId: rsvps.userId, meetupId: rsvps.meetupId })
      .from(rsvps)
      .where(
        inArray(
          rsvps.meetupId,
          ofCommunity.map((m) => m.id),
        ),
      );
    const byOtherMember = confirmed.filter((rsvp) => {
      const meetup = ofCommunity.find((m) => m.id === rsvp.meetupId)!;
      return rsvp.userId !== meetup.creatorId && isMember(rsvp.userId, meetup.communitySlug!);
    });
    expect(byOtherMember.length).toBeGreaterThanOrEqual(1);
  });

  it("os encontros abertos cobrem com vagas, lotado, sem confirmações, cancelado e passado", async () => {
    await runSeed(db);
    const open = (await seedMeetups()).filter((m) => m.communitySlug === null);
    const now = new Date();
    const active = open.filter((m) => m.status === "active" && m.startsAt > now);
    const attendeeCount = async (meetupId: string) =>
      (await db.select().from(rsvps).where(eq(rsvps.meetupId, meetupId))).length;

    expect(active.some((m) => m.occupiedSeats < m.capacity)).toBe(true);
    expect(active.some((m) => m.occupiedSeats === m.capacity)).toBe(true);
    const counts = await Promise.all(active.map((m) => attendeeCount(m.id)));
    expect(counts).toContain(0);
    expect(open.some((m) => m.status === "cancelled")).toBe(true);
    expect(open.some((m) => m.endsAt < now)).toBe(true);
  });

  it("um encontro futuro tem comentários de 2+ pessoas, um apagado pelo autor e outro pelo organizador", async () => {
    const info = vi.spyOn(logger, "info");
    await runSeed(db);
    const now = new Date();
    const future = (await seedMeetups()).filter((m) => m.startsAt > now);

    const deleted = info.mock.calls
      .map(([entry]) => entry as unknown as { event?: string; meetupId?: string; by?: string })
      .filter((entry) => entry.event === "comment.deleted");

    const matching = [];
    for (const meetup of future) {
      const rows = await commentsOf(meetup.id);
      const authors = new Set(rows.flatMap((row) => (row.authorId ? [row.authorId] : [])));
      const bys = deleted.filter((entry) => entry.meetupId === meetup.id).map((e) => e.by);
      const erased = rows.filter((row) => row.deletedAt !== null && row.body === null);
      const ok = authors.size >= 2 && bys.includes("self") && bys.includes("organizer");
      if (ok && erased.length >= 2) matching.push(meetup.id);
    }
    expect(matching).toHaveLength(1);
    info.mockRestore();
  });

  it("o encontro que já aconteceu tem comentários feitos antes do fim", async () => {
    await runSeed(db);
    const now = new Date();
    const past = (await seedMeetups()).filter((m) => m.endsAt < now);

    expect(past.length).toBeGreaterThanOrEqual(1);
    for (const meetup of past) {
      const rows = await db
        .select()
        .from(meetupComments)
        .where(and(eq(meetupComments.meetupId, meetup.id), isNull(meetupComments.deletedAt)));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.every((row) => row.createdAt < meetup.endsAt)).toBe(true);
    }
  });

  it("a mensagem final informa participações em comunidades e comentários criados", async () => {
    const counts = await runSeed(db);
    const ids = (await seedMeetups()).map((m) => m.id);
    const comments = await db
      .select()
      .from(meetupComments)
      .where(inArray(meetupComments.meetupId, ids));

    expect(counts.memberships).toBe((await memberships()).length);
    expect(counts.comments).toBe(comments.length);
    const message = seedSummary(counts);
    expect(message).toContain(`${counts.memberships} participações em comunidades`);
    expect(message).toContain(`${counts.comments} comentários`);
  });
});
