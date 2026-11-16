"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  onboardingCopy as copy,
  type OnboardingInput,
  onboardingSchema,
} from "@/modules/users/client";
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

const FORM_ID = "onboarding-form";

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

  const canContinue = declaration && consent && !pending;

  const onSubmit = handleSubmit((values) => {
    startTransition(() => dispatch(values));
  });

  return (
    <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
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
        <input type="checkbox" {...register("declaration")} className="mt-1 size-5 shrink-0" />
        <span>{copy.declarationLabel}</span>
      </label>

      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" {...register("consent")} className="mt-1 size-5 shrink-0" />
        <span>{copy.consentLabel}</span>
      </label>

      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.errors[state.code]}
        </p>
      ) : null}

      <Dialog>
        <DialogTrigger asChild>
          <Button disabled={!canContinue}>{copy.continueButton}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
            {/* O diálogo é renderizado fora do <form>; o atributo form liga o envio a ele. */}
            <DialogClose asChild>
              <Button type="submit" form={FORM_ID}>
                {copy.dialogConfirm}
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="secondary">{copy.dialogCancel}</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
