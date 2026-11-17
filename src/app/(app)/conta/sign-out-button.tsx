"use client";

import { useState } from "react";
import { accountCopy as copy } from "@/modules/users/client";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui";

// Sair não muda dados (encontros e presenças continuam): não pede confirmação.
// Navegação completa para "/" depois de sair, para nenhuma tela guardar a sessão antiga.
export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    setPending(true);
    setFailed(false);
    try {
      const { error } = await authClient.signOut();
      if (error) throw error;
      window.location.assign("/");
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" disabled={pending} onClick={signOut} className="sm:w-fit">
        {copy.signOutButton}
      </Button>
      {failed ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.signOutError}
        </p>
      ) : null}
    </div>
  );
}
