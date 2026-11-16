import { beforeEach, describe, expect, it } from "vitest";
import { cancelMeetup, createMeetup } from "@/modules/meetups";
import { confirmRsvp } from "@/modules/rsvps";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { loadMyMeetups } from "./load-my-meetups";

const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
const NOW = new Date("2026-11-20T12:00:00.000Z");

let db: Database;
let userA: string;
let userB: string;

beforeEach(async () => {
  db = await createTestDb();
  userA = await insertTestUser(db, "user-a");
  userB = await insertTestUser(db, "user-b");
});

async function create(creatorId: string, title: string, day: string) {
  const r = await createMeetup(
    db,
    creatorId,
    {
      title,
      startsAt: `${day}T15:00`,
      endsAt: `${day}T17:00`,
      address: "Rua X, 100",
      capacity: 10,
      publicPlace: true,
      withCompanion: false,
    },
    CREATED_AT,
  );
  if (!r.ok) throw new Error(`falha ao criar: ${r.error.code}`);
  return r.data.id;
}

describe("dados de meus encontros", () => {
  it("lista os encontros futuros criados pelo usuário", async () => {
    await create(userA, "futuro 1", "2026-12-05");
    await create(userA, "futuro 2", "2026-12-06");
    await create(userA, "passado", "2026-11-10");

    const { created } = await loadMyMeetups(db, userA, NOW);

    expect(created.map((m) => m.title)).toEqual(["futuro 1", "futuro 2"]);
  });

  it("lista os encontros futuros em que o usuário confirmou presença", async () => {
    const future = await create(userB, "futuro de B", "2026-12-05");
    const past = await create(userB, "passado de B", "2026-11-10");
    await confirmRsvp(db, userA, future, { withCompanion: false }, CREATED_AT);
    await confirmRsvp(db, userA, past, { withCompanion: false }, CREATED_AT);

    const { confirmed } = await loadMyMeetups(db, userA, NOW);

    expect(confirmed.map((m) => m.title)).toEqual(["futuro de B"]);
  });

  it("não repete o encontro criado na seção de confirmados", async () => {
    await create(userA, "meu encontro", "2026-12-05");

    const { created, confirmed } = await loadMyMeetups(db, userA, NOW);

    expect(created.map((m) => m.title)).toEqual(["meu encontro"]);
    expect(confirmed).toHaveLength(0);
  });

  it("mantém o encontro cancelado com status cancelado", async () => {
    const meetupId = await create(userB, "vai ser cancelado", "2026-12-05");
    await confirmRsvp(db, userA, meetupId, { withCompanion: false }, CREATED_AT);
    await cancelMeetup(db, userB, meetupId, CREATED_AT);

    const { confirmed } = await loadMyMeetups(db, userA, NOW);

    expect(confirmed[0]?.status).toBe("cancelled");
  });
});
