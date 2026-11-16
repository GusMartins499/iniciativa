"use client";

import { startTransition, useActionState } from "react";
import { accountCopy as copy } from "@/modules/users/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { DeleteAccountState } from "./state";

export type DeleteAccountPanelProps = {
  action: (state: DeleteAccountState) => Promise<DeleteAccountState>;
};

export function DeleteAccountPanel({ action }: DeleteAccountPanelProps) {
  const [state, dispatch, pending] = useActionState(action, { code: null });
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <p>{copy.deleteDescription}</p>
      <ConfirmDialog
        trigger={copy.deleteButton}
        title={copy.deleteButton}
        description={copy.deleteDescription}
        backLabel={copy.back}
        disabled={pending}
        onConfirm={() => startTransition(() => dispatch())}
      />
      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}
    </section>
  );
}
