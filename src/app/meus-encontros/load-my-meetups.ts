import { getByIds, listByCreator, type PublicMeetup } from "@/modules/meetups";
import { listMeetupIdsByUser } from "@/modules/rsvps";
import type { Database } from "@/shared/db";

export type MyMeetups = { created: PublicMeetup[]; confirmed: PublicMeetup[] };

// Composição de leitura pelos index.ts dos módulos, sem join entre as tabelas deles.
export async function loadMyMeetups(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<MyMeetups> {
  const [created, confirmedIds] = await Promise.all([
    listByCreator(db, userId, now),
    listMeetupIdsByUser(db, userId),
  ]);
  return { created, confirmed: await getByIds(db, confirmedIds, now) };
}
