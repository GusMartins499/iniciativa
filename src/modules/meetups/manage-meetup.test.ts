import { beforeEach, describe, expect, it } from "vitest";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { createMeetup } from "./create-meetup";
import { cancelMeetup, updateMeetup } from "./manage-meetup";
import { getMeetup, listUpcoming } from "./queries";
import { reserveSeats } from "./seats";

const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
const NOW = new Date("2026-11-20T12:00:00.000Z");
const AFTER_START = new Date("2026-12-05T18:30:00.000Z");

const baseInput = {
  title: "Café no centro",
  startsAt: "2026-12-05T15:00",
  endsAt: "2026-12-05T17:00",
  address: "Rua X, 100",
  capacity: 10,
  publicPlace: true,
  audience: "open",
  withCompanion: false,
};

let db: Database;
let creatorId: string;
let meetupId: string;

beforeEach(async () => {
  db = await createTestDb();
  creatorId = await insertTestUser(db, "creator");
  const r = await createMeetup(db, creatorId, baseInput, CREATED_AT);
  if (!r.ok) throw new Error(`falha ao criar: ${r.error.code}`);
  meetupId = r.data.id;
});

async function current() {
  const r = await getMeetup(db, meetupId);
  if (!r.ok) throw new Error("encontro sumiu");
  return r.data;
}

describe("meetups.updateMeetup", () => {
  it("atualiza os dados e marca o encontro como alterado", async () => {
    const r = await updateMeetup(
      db,
      creatorId,
      meetupId,
      { ...baseInput, title: "Café na praça" },
      NOW,
    );

    expect(r.ok).toBe(true);
    const meetup = await current();
    expect(meetup.title).toBe("Café na praça");
    expect(meetup.editedAt).not.toBeNull();
  });

  it("recusa quem não é o criador", async () => {
    const other = await insertTestUser(db, "other");

    const r = await updateMeetup(db, other, meetupId, baseInput, NOW);

    expect(r).toEqual({ ok: false, error: { code: "NOT_MEETUP_CREATOR" } });
  });

  it("recusa reduzir as vagas abaixo da ocupação", async () => {
    // O criador ocupa 1 vaga; mais 5 reservadas = 6 ocupadas.
    await db.transaction(async (tx) => {
      await reserveSeats(tx, meetupId, 5, NOW);
    });

    const below = await updateMeetup(db, creatorId, meetupId, { ...baseInput, capacity: 5 }, NOW);
    const equal = await updateMeetup(db, creatorId, meetupId, { ...baseInput, capacity: 6 }, NOW);

    expect(below).toEqual({ ok: false, error: { code: "CAPACITY_BELOW_OCCUPIED" } });
    expect(equal.ok).toBe(true);
  });

  it("recusa edição depois do início", async () => {
    const r = await updateMeetup(db, creatorId, meetupId, baseInput, AFTER_START);

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_STARTED" } });
  });

  it("aplica as mesmas validações da criação", async () => {
    const r = await updateMeetup(
      db,
      creatorId,
      meetupId,
      { ...baseInput, endsAt: baseInput.startsAt },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa editar encontro cancelado", async () => {
    await cancelMeetup(db, creatorId, meetupId, NOW);

    const r = await updateMeetup(db, creatorId, meetupId, baseInput, NOW);

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_CANCELLED" } });
  });
});

describe("meetups.cancelMeetup", () => {
  it("muda o status para cancelado", async () => {
    const r = await cancelMeetup(db, creatorId, meetupId, NOW);

    expect(r.ok).toBe(true);
    expect((await current()).status).toBe("cancelled");
  });

  it("recusa quem não é o criador", async () => {
    const other = await insertTestUser(db, "other");

    const r = await cancelMeetup(db, other, meetupId, NOW);

    expect(r).toEqual({ ok: false, error: { code: "NOT_MEETUP_CREATOR" } });
  });

  it("recusa depois do início", async () => {
    const r = await cancelMeetup(db, creatorId, meetupId, AFTER_START);

    expect(r).toEqual({ ok: false, error: { code: "MEETUP_STARTED" } });
  });

  it("é idempotente para encontro já cancelado", async () => {
    await cancelMeetup(db, creatorId, meetupId, NOW);

    const r = await cancelMeetup(db, creatorId, meetupId, NOW);

    expect(r.ok).toBe(true);
  });
});

describe("efeitos do cancelamento", () => {
  it("remove o encontro cancelado da lista de próximos", async () => {
    await cancelMeetup(db, creatorId, meetupId, NOW);

    const r = await listUpcoming(db, [], NOW);

    expect(r.ok && r.data.map((m) => m.id)).not.toContain(meetupId);
  });

  it("não reserva vaga em encontro cancelado", async () => {
    await cancelMeetup(db, creatorId, meetupId, NOW);

    const r = await db.transaction((tx) => reserveSeats(tx, meetupId, 1, NOW));

    expect(r.ok).toBe(false);
    expect((await current()).occupiedSeats).toBe(1);
  });
});
