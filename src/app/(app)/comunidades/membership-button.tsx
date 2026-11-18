"use client";

import { startTransition, useActionState } from "react";
import { communitiesCopy as copy } from "@/modules/communities/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { MembershipActionState } from "./state";

type Action = (state: MembershipActionState) => Promise<MembershipActionState>;

export type MembershipButtonProps = {
  name: string;
  isMember: boolean;
  joinAction: Action;
  leaveAction: Action;
};

// Entrar e sair mudam dados: os dois pedem confirmação com verbo literal.
export function MembershipButton({
  name,
  isMember,
  joinAction,
  leaveAction,
}: MembershipButtonProps) {
  const [joinState, join, joining] = useActionState(joinAction, { code: null });
  const [leaveState, leave, leaving] = useActionState(leaveAction, { code: null });
  const code = isMember ? leaveState.code : joinState.code;
  const pending = joining || leaving;

  return (
    <div className="flex flex-col gap-2">
      {isMember ? (
        <ConfirmDialog
          trigger={copy.leaveButton}
          title={copy.leaveDialogTitle}
          description={copy.leaveDialogDescription(name)}
          backLabel={copy.back}
          disabled={pending}
          triggerVariant="secondary"
          onConfirm={() => startTransition(() => leave())}
        />
      ) : (
        <ConfirmDialog
          trigger={copy.joinButton}
          title={copy.joinDialogTitle}
          description={copy.joinDialogDescription(name)}
          backLabel={copy.back}
          disabled={pending}
          onConfirm={() => startTransition(() => join())}
        />
      )}
      {code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[code]}
        </p>
      ) : null}
    </div>
  );
}
