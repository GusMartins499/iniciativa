"use client";

import { useActionState } from "react";
import { signInCopy as copy } from "@/modules/users/client";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui";

type SignInState = { failed: boolean };

async function signInWithGoogle(): Promise<SignInState> {
  // Em caso de sucesso o navegador é redirecionado para o Google.
  const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  return { failed: Boolean(error) };
}

export function SignInButton() {
  const [state, formAction, pending] = useActionState(signInWithGoogle, { failed: false });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Button type="submit" disabled={pending}>
        {copy.button}
      </Button>
      {state.failed ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.error}
        </p>
      ) : null}
    </form>
  );
}
