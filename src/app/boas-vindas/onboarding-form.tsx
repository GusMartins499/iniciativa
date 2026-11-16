"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { OnboardingCopy, OnboardingState } from "./state";

type OnboardingFormProps = {
  copy: OnboardingCopy;
  action: (state: OnboardingState, formData: FormData) => Promise<OnboardingState>;
};

export function OnboardingForm({ copy, action }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(action, { code: null });
  const [declaration, setDeclaration] = useState(false);
  const [consent, setConsent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const canContinue = declaration && consent && !pending;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <section
        aria-labelledby="termo-titulo"
        className="rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="termo-titulo" className="font-bold">
          {copy.consentTitle}
        </h2>
        {copy.consentText.map((paragraph) => (
          <p key={paragraph} className="mt-2 text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </section>

      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          name="declaration"
          checked={declaration}
          onChange={(e) => setDeclaration(e.target.checked)}
          className="mt-1 size-5 shrink-0"
        />
        <span>{copy.declarationLabel}</span>
      </label>

      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 size-5 shrink-0"
        />
        <span>{copy.consentLabel}</span>
      </label>

      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}

      <Button disabled={!canContinue} onClick={() => setConfirmOpen(true)}>
        {copy.continueButton}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
            <Button
              onClick={() => {
                setConfirmOpen(false);
                formRef.current?.requestSubmit();
              }}
            >
              {copy.dialogConfirm}
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">{copy.dialogCancel}</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
