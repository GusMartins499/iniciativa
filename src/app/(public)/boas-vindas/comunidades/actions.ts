"use server";

import { redirect } from "next/navigation";
import {
  type JoinCommunitiesInput,
  joinCommunities,
  joinCommunitiesSchema,
} from "@/modules/communities";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { reportError } from "@/shared/observability";
import type { JoinCommunitiesState } from "./state";

// Uma chamada só para todas as marcadas: o caso de uso grava em lote, numa transação.
export async function joinCommunitiesAction(
  _state: JoinCommunitiesState,
  input: JoinCommunitiesInput,
): Promise<JoinCommunitiesState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    const parsed = joinCommunitiesSchema.safeParse(input);
    if (!parsed.success) return { code: "VALIDATION_FAILED" };
    const result = await joinCommunities(getDb(), guard.data.id, parsed.data.slugs);
    if (!result.ok) return { code: result.error.code };
  } catch (error) {
    reportError(error, { event: "community.join_failed" });
    return { code: "UNEXPECTED" };
  }
  // redirect() lança internamente; fica fora do try para não ser tratado como falha.
  redirect("/encontros");
}
