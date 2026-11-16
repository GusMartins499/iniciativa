"use client";

import { useState } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

type ConfirmDialogProps = {
  trigger: string;
  title: string;
  description: string;
  backLabel: string;
  disabled: boolean;
  onConfirm: () => void;
  triggerVariant?: "primary" | "secondary";
  triggerClassName?: string;
};

// Ação que muda dados: o botão abre o diálogo, e o título repete o verbo literal.
export function ConfirmDialog({
  trigger,
  title,
  description,
  backLabel,
  disabled,
  onConfirm,
  triggerVariant = "primary",
  triggerClassName,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} variant={triggerVariant} className={triggerClassName}>
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {title}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">{backLabel}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
