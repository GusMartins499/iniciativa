import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { joinCommunity } from "@/modules/communities";
import { cancelMeetup } from "@/modules/meetups";
import { confirmRsvp } from "@/modules/rsvps";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
import { CREATED_AT, setupMeetup } from "@/modules/rsvps/test-setup";
import { anonymizeCommentsByAuthor, createComment, deleteComment, listComments } from "./comments";
import { meetupCommentStats, meetupComments } from "./schema";

// O encontro de setupMeetup vai de 05/12/2026 15:00 a 17:00 (São Paulo) = 18:00 a 20:00 UTC.
const NOW = new Date("2026-11-20T12:00:00.000Z");
const AFTER_END = new Date("2026-12-05T20:00:00.000Z");

let db: Database;
let creatorId: string;
let meetupId: string;
let guestId: string;

beforeEach(async () => {
  db = await createTestDb();
  ({ creatorId, meetupId } = await setupMeetup(db, 10));
  guestId = await insertTestUser(db, "guest", "Bia Souza");
});

async function post(userId: string, body: string, now = NOW, id = meetupId) {
  return createComment(db, userId, id, { body }, now);
}

async function postOk(userId: string, body: string, now = NOW) {
  const r = await post(userId, body, now);
  if (!r.ok) throw new Error(`falha ao comentar: ${r.error.code}`);
  return r.data.commentId;
}

async function list(viewerId: string, now = NOW) {
  const r = await listComments(db, meetupId, viewerId, now);
  if (!r.ok) throw new Error(`falha ao listar: ${r.error.code}`);
  return r.data;
}

async function communityMeetup() {
  return (await setupMeetup(db, 10, "rpg-", "rpg")).meetupId;
}

describe("comments: acesso", () => {
  it("quem vê o encontro lê e comenta, mesmo sem confirmar presença", async () => {
    await postOk(guestId, "Vou de metrô");

    const { comments } = await list(guestId);
    expect(comments.map((c) => c.body)).toEqual(["Vou de metrô"]);
  });

  it("não-membro recebe NOT_FOUND ao ler, comentar e apagar em encontro de comunidade", async () => {
    const hidden = await communityMeetup();
    const member = await insertTestUser(db, "member");
    await joinCommunity(db, member, "rpg");
    const created = await post(member, "oi", NOW, hidden);
    if (!created.ok) throw new Error("membro devia comentar");

    expect(await listComments(db, hidden, guestId, NOW)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
    expect(await post(guestId, "oi", NOW, hidden)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
    expect(await deleteComment(db, guestId, hidden, created.data.commentId)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("quem confirmou presença continua lendo depois de sair da comunidade", async () => {
    const hidden = await communityMeetup();
    await joinCommunity(db, guestId, "rpg");
    await confirmRsvp(db, guestId, hidden, { withCompanion: false }, CREATED_AT);

    expect((await listComments(db, hidden, guestId, NOW)).ok).toBe(true);
  });

  it("encontro inexistente responde NOT_FOUND", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    expect((await listComments(db, missing, guestId, NOW)).ok).toBe(false);
    expect(await post(guestId, "oi", NOW, missing)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("comments: lista", () => {
  it("mostra primeiro nome e foto, sem dizer quem confirmou presença", async () => {
    await postOk(guestId, "Oi");

    const [comment] = (await list(creatorId)).comments;
    expect(comment?.author).toEqual({ firstName: "Bia", image: null });
    expect(Object.keys(comment ?? {}).sort()).toEqual([
      "author",
      "body",
      "canDelete",
      "createdAt",
      "id",
      "isOrganizer",
    ]);
  });

  it("marca o comentário do criador como organizador", async () => {
    await postOk(creatorId, "Sala 3", NOW);
    await postOk(guestId, "Ok", new Date(NOW.getTime() + 1000));

    expect((await list(guestId)).comments.map((c) => c.isOrganizer)).toEqual([true, false]);
  });

  it("ordena do mais antigo para o mais novo", async () => {
    await postOk(guestId, "primeiro", NOW);
    await postOk(creatorId, "segundo", new Date(NOW.getTime() + 60_000));

    expect((await list(guestId)).comments.map((c) => c.body)).toEqual(["primeiro", "segundo"]);
  });

  it("mostra só os 200 mais recentes", async () => {
    await db.insert(meetupComments).values(
      Array.from({ length: 205 }, (_, i) => ({
        meetupId,
        authorId: guestId,
        body: `c${i}`,
        createdAt: new Date(NOW.getTime() - (205 - i) * 1000),
      })),
    );

    const { comments } = await list(guestId);
    expect(comments).toHaveLength(200);
    expect(comments[0]?.body).toBe("c5");
    expect(comments.at(-1)?.body).toBe("c204");
  });

  it("fica só para leitura depois do fim ou com o encontro cancelado", async () => {
    expect((await list(guestId)).readOnly).toBe(false);
    expect((await list(guestId, AFTER_END)).readOnly).toBe(true);

    await cancelMeetup(db, creatorId, meetupId, NOW);
    expect((await list(guestId)).readOnly).toBe(true);
  });
});

describe("comments.createComment", () => {
  it("recusa comentário vazio ou só com espaços", async () => {
    expect(await post(guestId, "   ")).toEqual({ ok: false, error: { code: "COMMENT_EMPTY" } });
  });

  it("recusa mais de 500 caracteres e conta emoji como 1", async () => {
    expect(await post(guestId, "a".repeat(501))).toEqual({
      ok: false,
      error: { code: "COMMENT_TOO_LONG" },
    });
    expect((await post(guestId, "😀".repeat(500))).ok).toBe(true);
  });

  it("recusa entrada que não é texto", async () => {
    const r = await createComment(db, guestId, meetupId, { body: 42 }, NOW);
    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa o 11º comentário no mesmo minuto e loga comment.rate_limited", async () => {
    const warn = vi.spyOn(logger, "warn");
    for (let i = 0; i < 10; i++) await postOk(guestId, `m${i}`, new Date(NOW.getTime() + i));

    expect(await post(guestId, "de novo", new Date(NOW.getTime() + 30_000))).toEqual({
      ok: false,
      error: { code: "RATE_LIMITED" },
    });
    expect(warn).toHaveBeenCalledWith({
      event: "comment.rate_limited",
      userId: guestId,
      meetupId,
    });
    expect((await post(guestId, "depois", new Date(NOW.getTime() + 61_000))).ok).toBe(true);
  });

  it("recusa depois do horário de fim", async () => {
    expect(await post(guestId, "oi", AFTER_END)).toEqual({
      ok: false,
      error: { code: "MEETUP_ENDED" },
    });
  });

  it("recusa com o encontro cancelado", async () => {
    await cancelMeetup(db, creatorId, meetupId, NOW);
    expect(await post(guestId, "oi")).toEqual({
      ok: false,
      error: { code: "MEETUP_CANCELLED" },
    });
  });

  it("loga comment.created só com IDs, nunca o texto", async () => {
    const info = vi.spyOn(logger, "info");
    const commentId = await postOk(guestId, "texto secreto");

    expect(info).toHaveBeenCalledWith({
      event: "comment.created",
      commentId,
      meetupId,
      userId: guestId,
    });
    expect(JSON.stringify(info.mock.calls)).not.toContain("texto secreto");
  });
});

describe("comments: medição do piloto", () => {
  async function stats() {
    const [row] = await db
      .select()
      .from(meetupCommentStats)
      .where(eq(meetupCommentStats.meetupId, meetupId));
    return row;
  }

  it("conta comentários e autores distintos a cada envio", async () => {
    await postOk(guestId, "a");
    await postOk(guestId, "b");
    await postOk(creatorId, "c");

    expect(await stats()).toEqual({ meetupId, commentCount: 3, distinctAuthors: 2 });
  });

  it("as contagens sobrevivem à exclusão dos comentários do autor", async () => {
    await postOk(guestId, "a");
    await postOk(creatorId, "b");

    await db.transaction((tx) => anonymizeCommentsByAuthor(tx, guestId, NOW));

    expect(await stats()).toEqual({ meetupId, commentCount: 2, distinctAuthors: 2 });
  });
});

describe("comments.deleteComment", () => {
  async function stored(commentId: string) {
    const [row] = await db.select().from(meetupComments).where(eq(meetupComments.id, commentId));
    return row;
  }

  it("o autor apaga o próprio: some o texto e o autor, fica o lugar", async () => {
    const info = vi.spyOn(logger, "info");
    const commentId = await postOk(guestId, "oi");

    expect(await deleteComment(db, guestId, meetupId, commentId, NOW)).toEqual({
      ok: true,
      data: undefined,
    });

    const row = await stored(commentId);
    expect(row?.body).toBeNull();
    expect(row?.authorId).toBeNull();
    expect(row?.deletedAt).toEqual(NOW);
    expect(info).toHaveBeenCalledWith({
      event: "comment.deleted",
      commentId,
      meetupId,
      userId: guestId,
      by: "self",
    });
    const [shown] = (await list(guestId)).comments;
    expect(shown).toMatchObject({ body: null, author: null, canDelete: false });
  });

  it("o criador apaga o comentário de outra pessoa", async () => {
    const info = vi.spyOn(logger, "info");
    const commentId = await postOk(guestId, "oi");

    expect((await deleteComment(db, creatorId, meetupId, commentId, NOW)).ok).toBe(true);
    expect(info).toHaveBeenCalledWith(expect.objectContaining({ by: "organizer" }));
  });

  it("ninguém mais apaga nem vê a opção", async () => {
    const other = await insertTestUser(db, "other", "Caio");
    const commentId = await postOk(guestId, "oi");

    expect(await deleteComment(db, other, meetupId, commentId, NOW)).toEqual({
      ok: false,
      error: { code: "NOT_COMMENT_AUTHOR" },
    });
    expect((await list(other)).comments[0]?.canDelete).toBe(false);
    expect((await list(guestId)).comments[0]?.canDelete).toBe(true);
    expect((await list(creatorId)).comments[0]?.canDelete).toBe(true);
    expect((await stored(commentId))?.body).toBe("oi");
  });

  it("comentário de outro encontro responde NOT_FOUND", async () => {
    const commentId = await postOk(guestId, "oi");
    const { meetupId: otherMeetup } = await setupMeetup(db, 10, "x-");

    expect(await deleteComment(db, guestId, otherMeetup, commentId, NOW)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("comments.anonymizeCommentsByAuthor", () => {
  it("vira comentário apagado e devolve o que mudou", async () => {
    const commentId = await postOk(guestId, "oi");
    await postOk(creatorId, "fica", new Date(NOW.getTime() + 1000));

    const changed = await db.transaction((tx) => anonymizeCommentsByAuthor(tx, guestId, NOW));

    expect(changed).toEqual([{ commentId, meetupId }]);
    const { comments } = await list(creatorId);
    expect(comments.map((c) => c.body)).toEqual([null, "fica"]);
  });
});
