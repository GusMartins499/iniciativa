"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  onboardingCopy as copy,
  type OnboardingInput,
  onboardingSchema,
} from "@/modules/users/client";
import { authClient } from "@/shared/auth/client";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import type { OnboardingState } from "./state";

export type OnboardingFormProps = {
  action: (state: OnboardingState, input: OnboardingInput) => Promise<OnboardingState>;
};

export function OnboardingForm({ action }: OnboardingFormProps) {
  const [state, dispatch, pending] = useActionState(action, { code: null });
  const { register, handleSubmit, control } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { declaration: false, consent: false },
  });
  const [declaration, consent] = useWatch({ control, name: ["declaration", "consent"] });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signUpFailed, setSignUpFailed] = useState(false);

  // Aceite gravado: agora sim vai para o Google pedindo o cadastro. Conta nova ou já
  // existente, o retorno passa sempre por /boas-vindas/concluir, que registra a
  // autodeclaração (idempotente) e segue para o app. O newUserCallbackURL do Better Auth
  // não serve aqui: ele só vale para conta recém-criada.
  useEffect(() => {
    if (state.code !== "SIGN_UP_READY") return;
    authClient.signIn
      .social({
        provider: "google",
        requestSignUp: true,
        callbackURL: "/boas-vindas/concluir",
      })
      .then(({ error }) => setSignUpFailed(Boolean(error)))
      .catch(() => setSignUpFailed(true));
  }, [state]);

  const errorCode = signUpFailed
    ? "SIGN_UP_FAILED"
    : state.code && state.code !== "SIGN_UP_READY"
      ? state.code
      : null;
  const formRef = useRef<HTMLFormElement>(null);

  const canContinue = declaration && consent && !pending && state.code !== "SIGN_UP_READY";

  // O envio acontece antes de fechar o diálogo: se o botão de envio sair do DOM
  // durante o clique, o navegador cancela a submissão.
  function confirm() {
    formRef.current?.requestSubmit();
    setConfirmOpen(false);
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(() => dispatch(values));
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <section
        aria-labelledby="consent-title"
        className="rounded-lg border border-border bg-surface p-4"
      >
        <h2 id="consent-title" className="font-bold">
          {copy.consentTitle}
        </h2>
        {copy.consentText.map((paragraph) => (
          <p key={paragraph} className="mt-2 text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <Link
          href="/privacidade"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-foreground underline"
        >
          {copy.privacyLink}
        </Link>
      </section>

      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" {...register("declaration")} className="mt-1 size-5 shrink-0" />
        <span>{copy.declarationLabel}</span>
      </label>

      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" {...register("consent")} className="mt-1 size-5 shrink-0" />
        <span>{copy.consentLabel}</span>
      </label>

      {errorCode ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[errorCode]}
        </p>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button disabled={!canContinue}>{copy.continueButton}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={confirm}>{copy.dialogConfirm}</Button>
            <DialogClose asChild>
              <Button variant="secondary">{copy.dialogCancel}</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
