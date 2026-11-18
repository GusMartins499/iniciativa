import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { listMemberSlugs } from "@/modules/communities";
import { canSeeMeetup, getCreatorId, getMeetup } from "@/modules/meetups";
import { getUserRsvp } from "@/modules/rsvps";
import { getPublicProfiles } from "@/shared/auth";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { commentInputSchema } from "./comment-input";
import type { CommentsErrorCode } from "./errors";
import { meetupCommentStats, meetupComments } from "./schema";

const LIST_LIMIT = 200;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

// Apagado: body e author vêm null. Nunca diz se a pessoa confirmou presença.
export type CommentView = {
  id: string;
  body: string | null;
  author: { firstName: string; image: string | null } | null;
  isOrganizer: boolean;
  canDelete: boolean;
  createdAt: Date;
};

export type MeetupComments = { comments: CommentView[]; readOnly: boolean };

type MeetupState = {
  creatorId: string | null;
  readOnly: boolean;
  closedCode: "MEETUP_ENDED" | "MEETUP_CANCELLED";
};

// A regra de acesso é a do encontro (canSeeMeetup). Invisível e inexistente respondem igual.
async function meetupFor(
  db: Database,
  userId: string,
  meetupId: string,
  now: Date,
): Promise<Result<MeetupState, "NOT_FOUND">> {
  const [memberSlugs, rsvp] = await Promise.all([
    listMemberSlugs(db, userId),
    getUserRsvp(db, userId, meetupId),
  ]);
  const access = await canSeeMeetup(db, meetupId, { userId, memberSlugs, hasRsvp: rsvp !== null });
  if (!access.visible) {
    if (access.communitySlug !== null) {
      logger.warn({ event: "comment.rejected", userId, meetupId, code: "NOT_COMMUNITY_MEMBER" });
    }
    return err("NOT_FOUND");
  }
  const [meetup, creatorId] = await Promise.all([
    getMeetup(db, meetupId),
    getCreatorId(db, meetupId),
  ]);
  if (!meetup.ok) return meetup;
  // O fim é lido do encontro a cada pedido: editar o encontro muda o prazo.
  const cancelled = meetup.data.status === "cancelled";
  const ended = meetup.data.endsAt <= now;
  return ok({
    creatorId,
    readOnly: cancelled || ended,
    closedCode: cancelled ? "MEETUP_CANCELLED" : "MEETUP_ENDED",
  });
}

export async function listComments(
  db: Database,
  meetupId: string,
  viewerId: string,
  now: Date = new Date(),
): Promise<Result<MeetupComments, "NOT_FOUND">> {
  const meetup = await meetupFor(db, viewerId, meetupId, now);
  if (!meetup.ok) return meetup;
  const { creatorId, readOnly } = meetup.data;
  // Os mais recentes, devolvidos do mais antigo para o mais novo.
  const rows = (
    await db
      .select({
        id: meetupComments.id,
        authorId: meetupComments.authorId,
        body: meetupComments.body,
        deletedAt: meetupComments.deletedAt,
        createdAt: meetupComments.createdAt,
      })
      .from(meetupComments)
      .where(eq(meetupComments.meetupId, meetupId))
      .orderBy(desc(meetupComments.createdAt), desc(meetupComments.id))
      .limit(LIST_LIMIT)
  ).reverse();
  const authorIds = [...new Set(rows.flatMap((row) => (row.authorId ? [row.authorId] : [])))];
  const profiles = await getPublicProfiles(db, authorIds);
  const comments = rows.map((row): CommentView => {
    const live = row.deletedAt === null && row.authorId !== null && row.body !== null;
    const profile = live && row.authorId ? profiles.get(row.authorId) : undefined;
    return {
      id: row.id,
      body: live ? row.body : null,
      author: profile ? { firstName: profile.firstName, image: profile.image } : null,
      isOrganizer: live && creatorId !== null && row.authorId === creatorId,
      canDelete: live && (row.authorId === viewerId || creatorId === viewerId),
      createdAt: row.createdAt,
    };
  });
  return ok({ comments, readOnly });
}

function rejected<C extends CommentsErrorCode>(code: C, userId: string, meetupId: string) {
  logger.warn({ event: "comment.rejected", userId, meetupId, code });
  return err(code);
}

function inputError(
  issueMessage: string | undefined,
): "VALIDATION_FAILED" | "COMMENT_EMPTY" | "COMMENT_TOO_LONG" {
  return issueMessage === "COMMENT_EMPTY" || issueMessage === "COMMENT_TOO_LONG"
    ? issueMessage
    : "VALIDATION_FAILED";
}

type CreateError =
  | "VALIDATION_FAILED"
  | "COMMENT_EMPTY"
  | "COMMENT_TOO_LONG"
  | "NOT_FOUND"
  | "MEETUP_ENDED"
  | "MEETUP_CANCELLED"
  | "RATE_LIMITED";

export async function createComment(
  db: Database,
  userId: string,
  meetupId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<Result<{ commentId: string }, CreateError>> {
  const parsed = commentInputSchema.safeParse(input);
  if (!parsed.success) {
    return rejected(inputError(parsed.error.issues[0]?.message), userId, meetupId);
  }
  const { body } = parsed.data;

  const result = await db.transaction(async (tx): Promise<Result<string, CreateError>> => {
    const meetup = await meetupFor(tx, userId, meetupId, now);
    if (!meetup.ok) return meetup;
    if (meetup.data.readOnly) return err(meetup.data.closedCode);

    // Anti-spam no Postgres (índice author_id, created_at). Dois envios simultâneos
    // podem passar 1 ou 2 do limite: aceitável.
    const [recent] = await tx
      .select({ total: count() })
      .from(meetupComments)
      .where(
        and(
          eq(meetupComments.authorId, userId),
          gt(meetupComments.createdAt, new Date(now.getTime() - RATE_WINDOW_MS)),
        ),
      );
    if ((recent?.total ?? 0) >= RATE_LIMIT) return err("RATE_LIMITED");

    // Autor novo no encontro = sem outro comentário vivo dele aqui. Quem apaga e comenta
    // de novo conta duas vezes (aproximação aceita no card).
    const [previous] = await tx
      .select({ id: meetupComments.id })
      .from(meetupComments)
      .where(and(eq(meetupComments.meetupId, meetupId), eq(meetupComments.authorId, userId)))
      .limit(1);
    const [comment] = await tx
      .insert(meetupComments)
      .values({ meetupId, authorId: userId, body, createdAt: now })
      .returning({ id: meetupComments.id });
    if (!comment) throw new Error("insert de comentário não devolveu linha");

    const newAuthor = previous ? 0 : 1;
    await tx
      .insert(meetupCommentStats)
      .values({ meetupId, commentCount: 1, distinctAuthors: newAuthor })
      .onConflictDoUpdate({
        target: meetupCommentStats.meetupId,
        set: {
          commentCount: sql`${meetupCommentStats.commentCount} + 1`,
          distinctAuthors: sql`${meetupCommentStats.distinctAuthors} + ${newAuthor}`,
        },
      });
    return ok(comment.id);
  });

  if (!result.ok) {
    if (result.error.code === "RATE_LIMITED") {
      logger.warn({ event: "comment.rate_limited", userId, meetupId });
      return result;
    }
    return result.error.code === "NOT_FOUND"
      ? result
      : rejected(result.error.code, userId, meetupId);
  }
  logger.info({ event: "comment.created", commentId: result.data, meetupId, userId });
  return ok({ commentId: result.data });
}

// Apagar = o texto e o autor deixam de existir no banco; o registro fica no lugar da conversa.
const erased = (now: Date) => ({ body: null, authorId: null, deletedAt: now });

export async function deleteComment(
  db: Database,
  userId: string,
  meetupId: string,
  commentId: string,
  now: Date = new Date(),
): Promise<Result<void, "NOT_FOUND" | "NOT_COMMENT_AUTHOR">> {
  // O id vem do cliente: fora do formato, responde como inexistente.
  if (!z.uuid().safeParse(commentId).success) return err("NOT_FOUND");
  const meetup = await meetupFor(db, userId, meetupId, now);
  if (!meetup.ok) return meetup;
  const [row] = await db
    .select({ authorId: meetupComments.authorId })
    .from(meetupComments)
    .where(and(eq(meetupComments.meetupId, meetupId), eq(meetupComments.id, commentId)));
  if (!row) return err("NOT_FOUND");
  // Já apagado (sem autor): apagar de novo não muda nada.
  if (row.authorId === null) return ok(undefined);

  let by: "self" | "organizer";
  if (row.authorId === userId) by = "self";
  else if (meetup.data.creatorId === userId) by = "organizer";
  else return rejected("NOT_COMMENT_AUTHOR", userId, meetupId);

  await db.update(meetupComments).set(erased(now)).where(eq(meetupComments.id, commentId));
  logger.info({ event: "comment.deleted", commentId, meetupId, userId, by });
  return ok(undefined);
}

// Exclusão de conta (orquestrada por users, na mesma transação). Quem chama loga
// comment.deleted depois do commit, com by: account_deletion.
export async function anonymizeCommentsByAuthor(
  tx: Database,
  userId: string,
  now: Date,
): Promise<{ commentId: string; meetupId: string }[]> {
  return tx
    .update(meetupComments)
    .set(erased(now))
    .where(eq(meetupComments.authorId, userId))
    .returning({ commentId: meetupComments.id, meetupId: meetupComments.meetupId });
}
