"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  type CommentActionCode,
  type CommentInput,
  commentInputSchema,
  commentsCopy as copy,
} from "@/modules/comments/client";
import { Button } from "@/shared/ui";
import type { CommentActionState } from "./comment-actions";

export type CommentFormProps = {
  createAction: (state: CommentActionState, input: unknown) => Promise<CommentActionState>;
};

const INITIAL: CommentActionState = { code: null };

export function CommentForm({ createAction }: CommentFormProps) {
  const [state, send, pending] = useActionState(createAction, INITIAL);
  const { register, handleSubmit, reset, formState } = useForm<CommentInput>({
    resolver: zodResolver(commentInputSchema),
    defaultValues: { body: "" },
  });
  // Cada envio devolve um estado novo: sem erro, o campo volta vazio.
  const lastState = useRef(state);
  useEffect(() => {
    if (state !== lastState.current && state.code === null) reset();
    lastState.current = state;
  }, [state, reset]);

  const fieldError = formState.errors.body?.message as CommentActionCode | undefined;
  const code = fieldError ?? state.code;
  return (
    <form
      noValidate
      className="flex flex-col gap-2"
      onSubmit={handleSubmit((values) => startTransition(() => send(values)))}
    >
      <label htmlFor="comment-body" className="font-semibold">
        {copy.fieldLabel}
      </label>
      <p id="comment-hint" className="text-sm text-muted-foreground">
        {copy.privacyHint}
      </p>
      <textarea
        id="comment-body"
        rows={3}
        aria-describedby={code ? "comment-hint comment-error" : "comment-hint"}
        aria-invalid={code ? true : undefined}
        className="rounded-md border border-border bg-surface p-3"
        {...register("body")}
      />
      {code ? (
        <p id="comment-error" role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[code] ?? copy.errors.VALIDATION_FAILED}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {copy.send}
      </Button>
    </form>
  );
}
