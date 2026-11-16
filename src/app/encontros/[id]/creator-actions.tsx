"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { meetupsCopy as copy } from "@/modules/meetups/client";
import type { MeetupFormState } from "../meetup-form-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

type CreatorActionsProps = {
  meetupId: string;
  cancelMeetupAction: (state: MeetupFormState) => Promise<MeetupFormState>;
};

export function CreatorActions({ meetupId, cancelMeetupAction }: CreatorActionsProps) {
  const [state, cancel, pending] = useActionState(cancelMeetupAction, { code: null });
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link
        href={`/encontros/${meetupId}/editar`}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold"
      >
        {copy.editLink}
      </Link>
      <ConfirmDialog
        trigger={copy.cancelMeetupButton}
        title={copy.cancelMeetupButton}
        description={copy.cancelMeetupDescription}
        backLabel={copy.back}
        disabled={pending}
        onConfirm={() => startTransition(() => cancel())}
      />
      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}
    </section>
  );
}
