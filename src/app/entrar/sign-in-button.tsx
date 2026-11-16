"use client";

import { useState } from "react";
import type { signInCopy } from "@/modules/users";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui";

type SignInButtonProps = {
  copy: typeof signInCopy;
};

export function SignInButton({ copy }: SignInButtonProps) {
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    setFailed(false);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (error) {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={signIn} disabled={pending}>
        {copy.button}
      </Button>
      {failed ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.error}
        </p>
      ) : null}
    </div>
  );
}
