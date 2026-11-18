import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { createMeetup, updateMeetup } from "@/modules/meetups";
import { meetups } from "@/modules/meetups/schema";
import { insertTestUser } from "@/shared/auth/test-helpers";
import { user } from "@/shared/auth/schema";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { purgeExpiredComments } from "./purge";
import { meetupCommentStats, meetupComments } from "./schema";

const CREATED_AT = new Date("2026-08-01T12:00:00.000Z");
const NOW = new Date("2026-11-20T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = await insertTestUser(db);
});

// Horário local de São Paulo (UTC-3), no formato do formulário.
function localTime(date: Date): string {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

async function meetupEndedDaysAgo(days: number) {
  const endsAt = new Date(NOW.getTime() - days * DAY);
  const r = await createMeetup(
    db,
    userId,
    {
      title: `terminou há ${days} dias`,
      startsAt: localTime(new Date(endsAt.getTime() - 2 * 60 * 60 * 1000)),
      endsAt: localTime(endsAt),
      address: "Rua X, 100",
      capacity: 10,
      publicPlace: true,
      audience: "open",
      withCompanion: false,
    },
    CREATED_AT,
  );
  if (!r.ok) throw new Error(`falha ao criar: ${r.error.code}`);
  return r.data.id;
}

async function addComments(meetupId: string, total: number) {
  for (let i = 0; i < total; i++) {
    await db.insert(meetupComments).values({ meetupId, authorId: userId, body: `oi ${i}` });
  }
}

async function commentCount(meetupId: string) {
  const rows = await db.select().from(meetupComments).where(eq(meetupComments.meetupId, meetupId));
  return rows.length;
}

describe("comments: schema", () => {
  it("recusa body com mais de 500 caracteres", async () => {
    const meetupId = await meetupEndedDaysAgo(-5);
    await expect(
      db.insert(meetupComments).values({ meetupId, authorId: userId, body: "a".repeat(501) }),
    ).rejects.toMatchObject({ cause: { constraint: "meetup_comments_body_max_500" } });
  });

  it("conta caracteres e não bytes: 500 emojis passam", async () => {
    const meetupId = await meetupEndedDaysAgo(-5);
    await db.insert(meetupComments).values({ meetupId, authorId: userId, body: "😀".repeat(500) });
    expect(await commentCount(meetupId)).toBe(1);
  });

  it("apagar o encontro apaga os comentários", async () => {
    const meetupId = await meetupEndedDaysAgo(-5);
    await addComments(meetupId, 2);

    await db.delete(meetups).where(eq(meetups.id, meetupId));

    expect(await db.select().from(meetupComments)).toEqual([]);
  });

  it("apagar o usuário deixa o comentário sem autor", async () => {
    const meetupId = await meetupEndedDaysAgo(-5);
    const otherId = await insertTestUser(db, "user-test-2", "Outra Pessoa");
    await db.insert(meetupComments).values({ meetupId, authorId: otherId, body: "oi" });

    await db.delete(user).where(eq(user.id, otherId));

    const rows = await db.select().from(meetupComments);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.authorId).toBeNull();
  });

  it("meetup_comment_stats não tem coluna de usuário", async () => {
    const result = (await db.execute(
      sql`select column_name from information_schema.columns where table_name = 'meetup_comment_stats' order by column_name`,
    )) as { rows: { column_name: string }[] };
    expect(result.rows.map((row) => row.column_name)).toEqual([
      "comment_count",
      "distinct_authors",
      "meetup_id",
    ]);
  });
});

describe("comments.purgeExpiredComments", () => {
  it("apaga só os comentários dos encontros que terminaram há mais de 30 dias", async () => {
    const old = await meetupEndedDaysAgo(31);
    const recent = await meetupEndedDaysAgo(29);
    const future = await meetupEndedDaysAgo(-5);
    await addComments(old, 3);
    await addComments(recent, 2);
    await addComments(future, 1);

    const count = await purgeExpiredComments(db, NOW);

    expect(count).toBe(3);
    expect(await commentCount(old)).toBe(0);
    expect(await commentCount(recent)).toBe(2);
    expect(await commentCount(future)).toBe(1);
  });

  it("é idempotente: a segunda execução não falha e devolve 0", async () => {
    const old = await meetupEndedDaysAgo(40);
    await addComments(old, 2);

    expect(await purgeExpiredComments(db, NOW)).toBe(2);
    expect(await purgeExpiredComments(db, NOW)).toBe(0);
  });

  it("sem encontros vencidos, devolve 0", async () => {
    expect(await purgeExpiredComments(db, NOW)).toBe(0);
  });

  it("não mexe em meetup_comment_stats", async () => {
    const old = await meetupEndedDaysAgo(31);
    await addComments(old, 2);
    await db
      .insert(meetupCommentStats)
      .values({ meetupId: old, commentCount: 2, distinctAuthors: 1 });

    await purgeExpiredComments(db, NOW);

    expect(await db.select().from(meetupCommentStats)).toEqual([
      { meetupId: old, commentCount: 2, distinctAuthors: 1 },
    ]);
  });

  it("usa a data de fim atual do encontro: editar o fim muda o corte", async () => {
    const meetupId = await meetupEndedDaysAgo(29);
    await addComments(meetupId, 1);
    expect(await purgeExpiredComments(db, NOW)).toBe(0);

    const [row] = await db.select().from(meetups).where(eq(meetups.id, meetupId));
    if (!row) throw new Error("encontro sumiu");
    // Encurta o encontro (editado antes do início) para o fim cair 31 dias atrás.
    const shortened = new Date(NOW.getTime() - 31 * DAY);
    const updated = await updateMeetup(
      db,
      userId,
      meetupId,
      {
        title: row.title,
        startsAt: localTime(new Date(shortened.getTime() - 60 * 60 * 1000)),
        endsAt: localTime(shortened),
        address: row.address,
        capacity: row.capacity,
        publicPlace: true,
        audience: "open",
        withCompanion: false,
      },
      CREATED_AT,
    );
    expect(updated.ok).toBe(true);

    expect(await purgeExpiredComments(db, NOW)).toBe(1);
  });
});
