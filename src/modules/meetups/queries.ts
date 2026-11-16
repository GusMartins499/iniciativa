import { and, asc, eq, gt, inArray } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { err, ok, type Result } from "@/shared/result";
import { meetups } from "./schema";

// Visão pública: sem criador, sem nomes — só a ocupação.
const publicColumns = {
  id: meetups.id,
  title: meetups.title,
  address: meetups.address,
  placeDescription: meetups.placeDescription,
  startsAt: meetups.startsAt,
  endsAt: meetups.endsAt,
  capacity: meetups.capacity,
  occupiedSeats: meetups.occupiedSeats,
  status: meetups.status,
  editedAt: meetups.editedAt,
};

type PublicRow = {
  [K in keyof typeof publicColumns]: (typeof meetups.$inferSelect)[K];
};

export type PublicMeetup = PublicRow & { isFull: boolean };

function toPublic(row: PublicRow): PublicMeetup {
  return { ...row, isFull: row.occupiedSeats >= row.capacity };
}

export async function listUpcoming(
  db: Database,
  now: Date = new Date(),
): Promise<Result<PublicMeetup[], never>> {
  const rows = await db
    .select(publicColumns)
    .from(meetups)
    .where(and(gt(meetups.startsAt, now), eq(meetups.status, "active")))
    .orderBy(asc(meetups.startsAt));
  return ok(rows.map(toPublic));
}

export async function getMeetup(
  db: Database,
  id: string,
): Promise<Result<PublicMeetup, "NOT_FOUND">> {
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(id)) {
    return err("NOT_FOUND");
  }
  const [row] = await db.select(publicColumns).from(meetups).where(eq(meetups.id, id)).limit(1);
  return row ? ok(toPublic(row)) : err("NOT_FOUND");
}

// "Meus encontros": futuros, ativos e cancelados — o cancelado aparece com o aviso.
export async function listByCreator(
  db: Database,
  userId: string,
  now: Date = new Date(),
): Promise<PublicMeetup[]> {
  const rows = await db
    .select(publicColumns)
    .from(meetups)
    .where(and(eq(meetups.creatorId, userId), gt(meetups.startsAt, now)))
    .orderBy(asc(meetups.startsAt));
  return rows.map(toPublic);
}

// Uma consulta só para vários encontros (evita N+1): futuros, ativos e cancelados.
export async function getByIds(
  db: Database,
  ids: string[],
  now: Date = new Date(),
): Promise<PublicMeetup[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select(publicColumns)
    .from(meetups)
    .where(and(inArray(meetups.id, ids), gt(meetups.startsAt, now)))
    .orderBy(asc(meetups.startsAt));
  return rows.map(toPublic);
}
