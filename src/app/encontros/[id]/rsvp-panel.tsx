"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm } from "react-hook-form";
import {
  type ConfirmRsvpInput,
  confirmRsvpSchema,
  rsvpsCopy as copy,
} from "@/modules/rsvps/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { RsvpActionState, RsvpStatus } from "./rsvp-state";

export type RsvpPanelProps = {
  status: RsvpStatus;
  confirmAction: (state: RsvpActionState, input: unknown) => Promise<RsvpActionState>;
  cancelAction: (state: RsvpActionState) => Promise<RsvpActionState>;
};

export function RsvpPanel({ status, confirmAction, cancelAction }: RsvpPanelProps) {
  const [confirmState, confirm, confirming] = useActionState(confirmAction, { code: null });
  const [cancelState, cancel, cancelling] = useActionState(cancelAction, { code: null });
  const { register, handleSubmit } = useForm<ConfirmRsvpInput>({
    resolver: zodResolver(confirmRsvpSchema),
    defaultValues: { withCompanion: false },
  });
  const code = confirmState.code ?? cancelState.code;
  const pending = confirming || cancelling;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      {status.kind === "creator" ? <p>{copy.creatorNote}</p> : null}
      {status.kind === "started" ? <p>{copy.startedNote}</p> : null}
      {status.kind === "confirmed" ? (
        <>
          <p>{status.withCompanion ? copy.confirmedWithCompanionNote : copy.confirmedNote}</p>
          <ConfirmDialog
            trigger={copy.cancelButton}
            title={copy.cancelDialogTitle}
            description={copy.cancelDialogDescription}
            backLabel={copy.back}
            disabled={pending}
            onConfirm={() => startTransition(() => cancel())}
          />
        </>
      ) : null}
      {status.kind === "open" ? (
        <>
          {status.full ? <p className="font-semibold">{copy.fullNote}</p> : null}
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              {...register("withCompanion")}
              disabled={status.full}
              className="mt-1 size-5 shrink-0"
            />
            <span>{copy.withCompanionLabel}</span>
          </label>
          <ConfirmDialog
            trigger={copy.confirmButton}
            title={copy.confirmDialogTitle}
            description={copy.confirmDialogDescription}
            backLabel={copy.back}
            disabled={status.full || pending}
            onConfirm={handleSubmit((values) => startTransition(() => confirm(values)))}
          />
        </>
      ) : null}
      {code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[code]}
        </p>
      ) : null}
    </section>
  );
}
