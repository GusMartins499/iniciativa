"use client";

import { startTransition, useActionState, useState } from "react";
import { rsvpsCopy as copy } from "@/modules/rsvps/client";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import type { RsvpActionState, RsvpStatus } from "./rsvp-state";

export type RsvpPanelProps = {
  status: RsvpStatus;
  confirmAction: (state: RsvpActionState, input: unknown) => Promise<RsvpActionState>;
  cancelAction: (state: RsvpActionState) => Promise<RsvpActionState>;
};

type ConfirmDialogProps = {
  trigger: string;
  title: string;
  description: string;
  disabled: boolean;
  onConfirm: () => void;
};

function ConfirmDialog({ trigger, title, description, disabled, onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>{trigger}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {title}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">{copy.back}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RsvpPanel({ status, confirmAction, cancelAction }: RsvpPanelProps) {
  const [confirmState, confirm, confirming] = useActionState(confirmAction, { code: null });
  const [cancelState, cancel, cancelling] = useActionState(cancelAction, { code: null });
  const [withCompanion, setWithCompanion] = useState(false);
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
              checked={withCompanion}
              onChange={(event) => setWithCompanion(event.target.checked)}
              disabled={status.full}
              className="mt-1 size-5 shrink-0"
            />
            <span>{copy.withCompanionLabel}</span>
          </label>
          <ConfirmDialog
            trigger={copy.confirmButton}
            title={copy.confirmDialogTitle}
            description={copy.confirmDialogDescription}
            disabled={status.full || pending}
            onConfirm={() => startTransition(() => confirm({ withCompanion }))}
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
