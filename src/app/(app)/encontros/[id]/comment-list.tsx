"use client";

import { startTransition, useActionState } from "react";
import { type CommentView, commentsCopy as copy } from "@/modules/comments/client";
import { formatAppDateTime } from "@/shared/time";
import { Avatar } from "@/shared/ui";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { CommentActionState } from "./comment-actions";

export type CommentListProps = {
  comments: CommentView[];
  deleteAction: (state: CommentActionState, commentId: string) => Promise<CommentActionState>;
};

// O texto entra como texto do React (escapado). ❌ Nunca dangerouslySetInnerHTML nem
// transformar URL em link.
export function CommentList({ comments, deleteAction }: CommentListProps) {
  const [state, remove, pending] = useActionState(deleteAction, { code: null });
  if (comments.length === 0) return <p className="text-muted-foreground">{copy.empty}</p>;
  return (
    <>
      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3 rounded-lg border border-border p-3">
            {comment.author ? (
              <Avatar
                name={comment.author.firstName}
                image={comment.author.image}
                size={32}
                className="size-8 text-sm"
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {comment.body === null ? (
                <p className="text-muted-foreground italic">{copy.deleted}</p>
              ) : (
                <>
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-bold">{comment.author?.firstName}</span>
                    {comment.isOrganizer ? (
                      <span className="rounded bg-honey-light px-1.5 font-semibold text-honey-light-foreground">
                        {copy.organizer}
                      </span>
                    ) : null}
                    <time
                      dateTime={comment.createdAt.toISOString()}
                      className="text-muted-foreground"
                    >
                      {formatAppDateTime(comment.createdAt)}
                    </time>
                  </p>
                  <p className="break-words whitespace-pre-wrap">{comment.body}</p>
                </>
              )}
              {comment.canDelete ? (
                <ConfirmDialog
                  trigger={copy.delete}
                  title={copy.delete}
                  description={copy.deleteDescription}
                  backLabel={copy.back}
                  disabled={pending}
                  triggerVariant="secondary"
                  triggerClassName="self-start"
                  onConfirm={() => startTransition(() => remove(comment.id))}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
