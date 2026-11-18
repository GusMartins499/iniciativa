import { and, asc, count, eq, gt, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import type { CommunitySlug } from "@/modules/communities";
import type { Database } from "@/shared/db";
import { err, ok, type Result } from "@/shared/result";
import { meetups } from "./schema";

const UUID = /^[0-9a-f-]{36}$/i;

// Visão pública: sem criador e sem nomes, só a ocupação.
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
  communitySlug: meetups.communitySlug,
};

type PublicRow = {
  [K in keyof typeof publicColumns]: (typeof meetups.$inferSelect)[K];
};

export type PublicMeetup = PublicRow & { isFull: boolean };

function toPublic(row: PublicRow): PublicMeetup {
  return { ...row, isFull: row.occupiedSeats >= row.capacity };
}

const upcoming = (now: Date) => and(gt(meetups.startsAt, now), eq(meetups.status, "active"));

// Abertos mais os das comunidades da pessoa (slugs de communities.listMemberSlugs).
// O filtro fica no SQL: encontro de comunidade alheia nunca sai do banco.
export async function listUpcoming(
  db: Database,
  memberSlugs: readonly CommunitySlug[],
  now: Date = new Date(),
): Promise<Result<PublicMeetup[], never>> {
  const audience =
    memberSlugs.length > 0
      ? or(isNull(meetups.communitySlug), inArray(meetups.communitySlug, [...memberSlugs]))
      : isNull(meetups.communitySlug);
  const rows = await db
    .select(publicColumns)
    .from(meetups)
    .where(and(upcoming(now), audience))
    .orderBy(asc(meetups.startsAt));
  return ok(rows.map(toPublic));
}

// Só para membros: quem chama confere a participação antes (página da comunidade).
export async function listUpcomingByCommunity(
  db: Database,
  slug: CommunitySlug,
  now: Date = new Date(),
): Promise<PublicMeetup[]> {
  const rows = await db
    .select(publicColumns)
    .from(meetups)
    .where(and(upcoming(now), eq(meetups.communitySlug, slug)))
    .orderBy(asc(meetups.startsAt));
  return rows.map(toPublic);
}

// A contagem é pública, como a de membros.
export async function countUpcomingByCommunity(
  db: Database,
  slug: CommunitySlug,
  now: Date = new Date(),
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(meetups)
    .where(and(upcoming(now), eq(meetups.communitySlug, slug)));
  return row?.total ?? 0;
}

// A lista de comunidades mostra a contagem de todas: uma consulta agrupada, sem N+1.
// Comunidade sem encontro futuro fica fora do mapa (quem lê assume 0).
export async function countUpcomingByCommunities(
  db: Database,
  now: Date = new Date(),
): Promise<Map<CommunitySlug, number>> {
  const rows = await db
    .select({ slug: meetups.communitySlug, total: count() })
    .from(meetups)
    .where(and(upcoming(now), isNotNull(meetups.communitySlug)))
    .groupBy(meetups.communitySlug);
  return new Map(
    rows.flatMap((row) => (row.slug === null ? [] : [[row.slug, row.total] as const])),
  );
}

export type MeetupViewer = {
  userId: string;
  memberSlugs: readonly CommunitySlug[];
  // Vem de rsvps.getUserRsvp: meetups não lê a tabela de presenças.
  hasRsvp: boolean;
};

export type MeetupAccess = { visible: boolean; communitySlug: CommunitySlug | null };

// Regra única do encontro individual (página, presença, comentários): a regra das listas,
// ou ser o criador, ou ter presença confirmada. Quem sai da comunidade continua vendo o
// encontro em que confirmou. Inexistente e invisível respondem igual, para não vazar.
export async function canSeeMeetup(
  db: Database,
  meetupId: string,
  viewer: MeetupViewer,
): Promise<MeetupAccess> {
  if (!UUID.test(meetupId)) return { visible: false, communitySlug: null };
  const [row] = await db
    .select({ creatorId: meetups.creatorId, communitySlug: meetups.communitySlug })
    .from(meetups)
    .where(eq(meetups.id, meetupId))
    .limit(1);
  if (!row) return { visible: false, communitySlug: null };
  const visible =
    row.communitySlug === null ||
    viewer.memberSlugs.includes(row.communitySlug) ||
    row.creatorId === viewer.userId ||
    viewer.hasRsvp;
  return { visible, communitySlug: row.communitySlug };
}

export async function getMeetup(
  db: Database,
  id: string,
): Promise<Result<PublicMeetup, "NOT_FOUND">> {
  if (!UUID.test(id)) {
    return err("NOT_FOUND");
  }
  const [row] = await db.select(publicColumns).from(meetups).where(eq(meetups.id, id)).limit(1);
  return row ? ok(toPublic(row)) : err("NOT_FOUND");
}

// "Meus encontros": futuros, ativos e cancelados. O cancelado aparece com o aviso.
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

// Para o apagamento de comentários (comments): os encontros que terminaram antes do corte,
// cancelados inclusive.
export async function listEndedBefore(db: Database, cutoff: Date): Promise<string[]> {
  const rows = await db.select({ id: meetups.id }).from(meetups).where(lt(meetups.endsAt, cutoff));
  return rows.map((row) => row.id);
}
