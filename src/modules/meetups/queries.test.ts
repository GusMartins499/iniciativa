import { beforeEach, describe, expect, it } from "vitest";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { createMeetup } from "./create-meetup";
import { getMeetup, listEndedBefore, listUpcoming } from "./queries";

const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
const NOW = new Date("2026-11-20T12:00:00.000Z");

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = await insertTestUser(db);
});

async function create(title: string, day: string, extra: Record<string, unknown> = {}) {
  const r = await createMeetup(
    db,
    userId,
    {
      title,
      startsAt: `${day}T15:00`,
      endsAt: `${day}T17:00`,
      address: "Rua X, 100",
      capacity: 10,
      publicPlace: true,
      audience: "open",
      withCompanion: false,
      ...extra,
    },
    CREATED_AT,
  );
  if (!r.ok) throw new Error(`falha ao criar: ${r.error.code}`);
  return r.data.id;
}

describe("meetups.listUpcoming", () => {
  it("lista só encontros futuros em ordem de início", async () => {
    await create("passado", "2026-11-15");
    await create("dia 10", "2026-12-10");
    await create("dia 5", "2026-12-05");

    const r = await listUpcoming(db, [], "all", NOW);

    expect(r.ok && r.data.map((m) => m.title)).toEqual(["dia 5", "dia 10"]);
  });
});

describe("meetups.listEndedBefore", () => {
  it("devolve só os IDs dos encontros que terminaram antes do corte", async () => {
    const ended = await create("terminou", "2026-11-10");
    await create("terminou depois do corte", "2026-11-15");
    await create("futuro", "2026-12-05");

    const ids = await listEndedBefore(db, new Date("2026-11-12T00:00:00.000Z"));

    expect(ids).toEqual([ended]);
  });
});

describe("meetups.getMeetup", () => {
  it("devolve a ocupação e nenhum dado pessoal", async () => {
    const id = await create("Café", "2026-12-05", { withCompanion: true });

    const r = await getMeetup(db, id);

    expect(r).toMatchObject({ ok: true, data: { occupiedSeats: 2, capacity: 10, isFull: false } });
    expect(r.ok && r.data).not.toHaveProperty("attendees");
    expect(r.ok && r.data).not.toHaveProperty("creatorId");
  });

  it("marca isFull quando a ocupação chega às vagas", async () => {
    const id = await create("Café", "2026-12-05", { withCompanion: true, capacity: 2 });

    const r = await getMeetup(db, id);

    expect(r).toMatchObject({ ok: true, data: { isFull: true } });
  });

  it("devolve NOT_FOUND para encontro inexistente", async () => {
    const r = await getMeetup(db, "00000000-0000-0000-0000-000000000000");

    expect(r).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });
});
