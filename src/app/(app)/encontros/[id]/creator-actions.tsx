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
    <div className="flex flex-col gap-3">
      <Link
        href={`/encontros/${meetupId}/editar`}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {copy.editLink}
      </Link>
      <ConfirmDialog
        trigger={copy.cancelMeetupButton}
        title={copy.cancelMeetupButton}
        description={copy.cancelMeetupDescription}
        backLabel={copy.back}
        disabled={pending}
        triggerVariant="secondary"
        onConfirm={() => startTransition(() => cancel())}
      />
      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}
    </div>
  );
}
