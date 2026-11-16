"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import {
  type MeetupFormValues,
  meetupFormSchema,
  meetupsCopy,
  toMeetupInput,
} from "@/modules/meetups/client";
import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { MeetupFormState } from "./meetup-form-state";

const copy = meetupsCopy.form;
const inputClass = "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-base";

type FieldName = keyof typeof copy.fieldErrors;

export type MeetupFormProps = {
  action: (state: MeetupFormState, input: unknown) => Promise<MeetupFormState>;
  // Na edição o acompanhante do criador não muda (fora do escopo do MVP).
  mode?: "create" | "edit";
  defaultValues?: Partial<MeetupFormValues>;
};

function FieldError({ errors, name }: { errors: FieldErrors<MeetupFormValues>; name: FieldName }) {
  if (!errors[name]) return null;
  return (
    <p id={`${name}-error`} className="text-sm font-semibold text-honey-light-foreground">
      {copy.fieldErrors[name]}
    </p>
  );
}

export function MeetupForm({ action, mode = "create", defaultValues }: MeetupFormProps) {
  const texts = mode === "edit" ? meetupsCopy.editForm : copy;
  const [state, dispatch, pending] = useActionState(action, { code: null });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<MeetupFormValues>({
    resolver: zodResolver(meetupFormSchema),
    defaultValues: {
      placeDescription: "",
      publicPlace: false,
      withCompanion: false,
      ...defaultValues,
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => dispatch(toMeetupInput(values)));
  });

  // Só abre a confirmação com o formulário válido; os erros aparecem junto dos campos.
  async function openConfirm() {
    if (await trigger()) setConfirmOpen(true);
  }

  // Envia antes de fechar: se o botão sair do DOM durante o clique, o navegador cancela o envio.
  function confirm() {
    formRef.current?.requestSubmit();
    setConfirmOpen(false);
  }

  const field = (name: FieldName) => ({
    id: name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="title">{copy.titleLabel}</label>
        <input {...register("title")} {...field("title")} className={inputClass} />
        <FieldError errors={errors} name="title" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="date">{copy.dateLabel}</label>
        <input type="date" {...register("date")} {...field("date")} className={inputClass} />
        <FieldError errors={errors} name="date" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="startTime">{copy.startTimeLabel}</label>
          <input
            type="time"
            {...register("startTime")}
            {...field("startTime")}
            className={inputClass}
          />
          <FieldError errors={errors} name="startTime" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="endTime">{copy.endTimeLabel}</label>
          <input
            type="time"
            {...register("endTime")}
            {...field("endTime")}
            className={inputClass}
          />
          <FieldError errors={errors} name="endTime" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="address">{copy.addressLabel}</label>
        <input {...register("address")} {...field("address")} className={inputClass} />
        <FieldError errors={errors} name="address" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="placeDescription">{copy.placeDescriptionLabel}</label>
        <textarea
          {...register("placeDescription")}
          {...field("placeDescription")}
          rows={3}
          placeholder={copy.placeDescriptionHint}
          className={`${inputClass} py-2`}
        />
        <FieldError errors={errors} name="placeDescription" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="capacity">{copy.capacityLabel}</label>
        <input
          type="number"
          min={1}
          max={50}
          {...register("capacity", { valueAsNumber: true })}
          {...field("capacity")}
          className={inputClass}
        />
        <FieldError errors={errors} name="capacity" />
      </div>
      {mode === "create" ? (
        <label className="flex min-h-11 items-start gap-3">
          <input type="checkbox" {...register("withCompanion")} className="mt-1 size-5 shrink-0" />
          <span>{copy.withCompanionLabel}</span>
        </label>
      ) : null}
      <div className="flex flex-col gap-1">
        <label className="flex min-h-11 items-start gap-3">
          <input
            type="checkbox"
            {...register("publicPlace")}
            {...field("publicPlace")}
            className="mt-1 size-5 shrink-0"
          />
          <span>{copy.publicPlaceLabel}</span>
        </label>
        <FieldError errors={errors} name="publicPlace" />
      </div>

      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {meetupsCopy.errors[state.code]}
        </p>
      ) : null}

      <Button onClick={openConfirm} disabled={pending}>
        {texts.submit}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogTitle>{texts.dialogTitle}</DialogTitle>
          <DialogDescription>{texts.dialogDescription}</DialogDescription>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={confirm}>{texts.dialogConfirm}</Button>
            <DialogClose asChild>
              <Button variant="secondary">{texts.dialogCancel}</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
