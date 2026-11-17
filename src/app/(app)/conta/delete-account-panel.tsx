"use client";

import { startTransition, useActionState } from "react";
import { accountCopy as copy } from "@/modules/users/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { DeleteAccountState } from "./state";

export type DeleteAccountPanelProps = {
  action: (state: DeleteAccountState) => Promise<DeleteAccountState>;
};

// Ação definitiva: as consequências em lista, o botão sem destaque (contornado) e o
// diálogo de confirmação com o verbo literal antes de apagar qualquer coisa.
export function DeleteAccountPanel({ action }: DeleteAccountPanelProps) {
  const [state, dispatch, pending] = useActionState(action, { code: null });
  return (
    <section
      aria-labelledby="delete-account-title"
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id="delete-account-title" className="text-lg font-bold">
        {copy.deleteTitle}
      </h2>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-muted-foreground marker:text-border-strong">
        {copy.deleteConsequences.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="font-semibold">{copy.deleteIrreversible}</p>
      <ConfirmDialog
        trigger={copy.deleteButton}
        title={copy.deleteButton}
        description={copy.deleteDescription}
        backLabel={copy.back}
        disabled={pending}
        onConfirm={() => startTransition(() => dispatch())}
        triggerVariant="secondary"
        triggerClassName="sm:w-fit"
      />
      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}
    </section>
  );
}
