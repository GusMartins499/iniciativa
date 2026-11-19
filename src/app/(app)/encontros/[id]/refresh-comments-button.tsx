"use client";

import { useFormStatus } from "react-dom";
import { commentsCopy as copy } from "@/modules/comments/client";
import { Button } from "@/shared/ui";

// Cada clique renderiza a página inteira de novo: o botão fica desabilitado até a
// atualização terminar, para o clique repetido não multiplicar as consultas ao banco.
export function RefreshCommentsButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" variant="secondary" disabled={pending}>
        {copy.refresh}
      </Button>
      <output className="sr-only">{pending ? copy.refreshing : ""}</output>
    </>
  );
}
