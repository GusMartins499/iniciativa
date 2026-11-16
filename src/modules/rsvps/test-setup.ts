import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createMeetup } from "@/modules/meetups";

export const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
export const NOW = new Date("2026-11-20T12:00:00.000Z");
export const AFTER_START = new Date("2026-12-05T18:30:00.000Z");

// Encontro em 05/12/2026 15:00 (São Paulo) criado por "creator", sem acompanhante.
export async function setupMeetup(db: Database, capacity: number, prefix = "") {
  const creatorId = await insertTestUser(db, `${prefix}creator`);
  const r = await createMeetup(
    db,
    creatorId,
    {
      title: "Café",
      startsAt: "2026-12-05T15:00",
      endsAt: "2026-12-05T17:00",
      address: "Rua X, 100",
      capacity,
      publicPlace: true,
      withCompanion: false,
    },
    CREATED_AT,
  );
  if (!r.ok) throw new Error(`falha ao criar encontro: ${r.error.code}`);
  return { creatorId, meetupId: r.data.id };
}
