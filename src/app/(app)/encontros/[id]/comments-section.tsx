import { commentsCopy as copy, type MeetupComments } from "@/modules/comments";
import type { CommentActionState } from "./comment-actions";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { RefreshCommentsButton } from "./refresh-comments-button";

type CommentsSectionProps = MeetupComments & {
  createAction: (state: CommentActionState, input: unknown) => Promise<CommentActionState>;
  deleteAction: (state: CommentActionState, commentId: string) => Promise<CommentActionState>;
  refreshAction: () => Promise<void>;
};

// No fim da página do encontro: do mais antigo para o mais novo, com o campo no final.
export function CommentsSection(props: CommentsSectionProps) {
  return (
    <section
      id="comentarios"
      aria-labelledby="comments-title"
      className="flex flex-col gap-4 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="comments-title" className="text-[17px] font-bold">
          {copy.title}
        </h2>
        <form action={props.refreshAction}>
          <RefreshCommentsButton />
        </form>
      </div>
      <CommentList comments={props.comments} deleteAction={props.deleteAction} />
      {props.readOnly ? (
        <p className="font-semibold">{copy.readOnly}</p>
      ) : (
        <CommentForm createAction={props.createAction} />
      )}
    </section>
  );
}
