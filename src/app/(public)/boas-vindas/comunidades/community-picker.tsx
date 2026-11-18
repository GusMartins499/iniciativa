"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  type Community,
  communitiesCopy,
  type JoinCommunitiesInput,
  joinCommunitiesSchema,
} from "@/modules/communities/client";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { JoinCommunitiesState } from "./state";

const copy = communitiesCopy.onboarding;

export type CommunityPickerProps = {
  communities: readonly Community[];
  action: (
    state: JoinCommunitiesState,
    input: JoinCommunitiesInput,
  ) => Promise<JoinCommunitiesState>;
};

export function CommunityPicker({ communities, action }: CommunityPickerProps) {
  const [state, dispatch, pending] = useActionState(action, { code: null });
  const { register, handleSubmit, control } = useForm<JoinCommunitiesInput>({
    resolver: zodResolver(joinCommunitiesSchema),
    defaultValues: { slugs: [] },
  });
  const checked = useWatch({ control, name: "slugs" });
  // Na ordem da lista, não na ordem em que foram marcadas.
  const chosen = communities.filter((community) => checked.includes(community.slug));

  const submit = handleSubmit((values) => {
    startTransition(() => dispatch(values));
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{copy.listLabel}</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {communities.map((community) => (
            <li key={community.slug}>
              <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <input
                  type="checkbox"
                  value={community.slug}
                  {...register("slugs")}
                  className="mt-1 size-5 shrink-0"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-bold">{community.name}</span>
                  <span className="text-muted-foreground">
                    {communitiesCopy.description(community.slug)}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {state.code ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {communitiesCopy.errors[state.code]}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
        <ConfirmDialog
          trigger={copy.continueButton}
          title={copy.dialogTitle}
          description={copy.dialogDescription(chosen.map((community) => community.name))}
          backLabel={communitiesCopy.back}
          disabled={chosen.length === 0 || pending}
          onConfirm={() => void submit()}
        />
        <Link
          href="/encontros"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold text-foreground hover:bg-background"
        >
          {copy.skipButton}
        </Link>
      </div>
    </form>
  );
}
