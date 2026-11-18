"use server";

import { revalidatePath } from "next/cache";
import { type CommentActionCode, createComment, deleteComment } from "@/modules/comments";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { reportError } from "@/shared/observability";

export type CommentActionState = { code: CommentActionCode | null };

async function run(
  meetupId: string,
  event: string,
  useCase: (userId: string) => Promise<{ ok: boolean; error?: { code: CommentActionCode } }>,
): Promise<CommentActionState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    const result = await useCase(guard.data.id);
    if (!result.ok && result.error) return { code: result.error.code };
  } catch (error) {
    reportError(error, { event, meetupId });
    return { code: "UNEXPECTED" };
  }
  revalidatePath(`/encontros/${meetupId}`);
  return { code: null };
}

// A entrada vem do cliente: o caso de uso valida de novo com Zod, e o acesso (404) e o
// prazo são conferidos no servidor.
export async function createCommentAction(
  meetupId: string,
  _state: CommentActionState,
  input: unknown,
): Promise<CommentActionState> {
  return run(meetupId, "comment.create_failed", (userId) =>
    createComment(getDb(), userId, meetupId, input),
  );
}

export async function deleteCommentAction(
  meetupId: string,
  _state: CommentActionState,
  commentId: string,
): Promise<CommentActionState> {
  return run(meetupId, "comment.delete_failed", (userId) =>
    deleteComment(getDb(), userId, meetupId, commentId),
  );
}

// "Atualizar comentários": a lista só muda quando a pessoa pede. Sem polling.
export async function refreshCommentsAction(meetupId: string): Promise<void> {
  const guard = await requireOnboardedUser();
  if (guard.ok) revalidatePath(`/encontros/${meetupId}`);
}
