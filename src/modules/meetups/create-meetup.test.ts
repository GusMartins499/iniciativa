import { beforeEach, describe, expect, it } from "vitest";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { createMeetup } from "./create-meetup";

const NOW = new Date("2026-11-20T12:00:00.000Z");

const validInput = {
  title: "Café no centro",
  startsAt: "2026-11-21T15:00",
  endsAt: "2026-11-21T17:00",
  address: "Rua X, 100",
  capacity: 10,
  publicPlace: true,
  audience: "open",
  withCompanion: false,
};

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = await insertTestUser(db);
});

describe("meetups.createMeetup", () => {
  it("cria o encontro com o criador ocupando 1 vaga", async () => {
    const r = await createMeetup(db, userId, validInput, NOW);

    expect(r).toMatchObject({ ok: true, data: { occupiedSeats: 1, creatorId: userId } });
  });

  it("conta o acompanhante do criador como vaga", async () => {
    const r = await createMeetup(db, userId, { ...validInput, withCompanion: true }, NOW);

    expect(r).toMatchObject({ ok: true, data: { occupiedSeats: 2 } });
  });

  it("aceita encontro sem descrição do local", async () => {
    const r = await createMeetup(db, userId, validInput, NOW);

    expect(r).toMatchObject({ ok: true, data: { placeDescription: null } });
  });

  it.each(["title", "startsAt", "endsAt", "address", "capacity"])(
    "recusa sem o campo obrigatório %s",
    async (field) => {
      const input: Record<string, unknown> = { ...validInput };
      delete input[field];

      const r = await createMeetup(db, userId, input, NOW);

      expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
    },
  );

  it("recusa sem a declaração de local público", async () => {
    const r = await createMeetup(db, userId, { ...validInput, publicPlace: false }, NOW);

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa término antes ou igual ao início", async () => {
    const r = await createMeetup(db, userId, { ...validInput, endsAt: validInput.startsAt }, NOW);

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa início no passado", async () => {
    const r = await createMeetup(
      db,
      userId,
      { ...validInput, startsAt: "2026-11-19T15:00", endsAt: "2026-11-19T17:00" },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa vagas menores que a ocupação do criador", async () => {
    const r = await createMeetup(
      db,
      userId,
      { ...validInput, capacity: 1, withCompanion: true },
      NOW,
    );

    expect(r).toEqual({ ok: false, error: { code: "CAPACITY_BELOW_OCCUPIED" } });
  });

  it("grava os horários em UTC a partir do horário de America/Sao_Paulo", async () => {
    const r = await createMeetup(
      db,
      userId,
      { ...validInput, startsAt: "2026-12-05T15:00", endsAt: "2026-12-05T17:00" },
      NOW,
    );

    expect(r.ok && r.data.startsAt.toISOString()).toBe("2026-12-05T18:00:00.000Z");
  });
});
