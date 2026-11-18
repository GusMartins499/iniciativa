"use server";

import { revalidatePath } from "next/cache";
import { joinCommunity, leaveCommunity } from "@/modules/communities";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { reportError } from "@/shared/observability";
import type { MembershipActionState } from "./state";

async function run(
  slug: string,
  event: string,
  useCase: (userId: string) => Promise<{ ok: true } | { ok: false; error: { code: "NOT_FOUND" } }>,
): Promise<MembershipActionState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    const result = await useCase(guard.data.id);
    if (!result.ok) return { code: result.error.code };
  } catch (error) {
    reportError(error, { event, communitySlug: slug });
    return { code: "UNEXPECTED" };
  }
  revalidatePath("/comunidades");
  revalidatePath(`/comunidades/${slug}`);
  return { code: null };
}

// O slug vem do cliente: o caso de uso confere contra a lista fixa.
export async function joinCommunityAction(
  slug: string,
  _state: MembershipActionState,
): Promise<MembershipActionState> {
  return run(slug, "community.join_failed", (userId) => joinCommunity(getDb(), userId, slug));
}

export async function leaveCommunityAction(
  slug: string,
  _state: MembershipActionState,
): Promise<MembershipActionState> {
  return run(slug, "community.leave_failed", (userId) => leaveCommunity(getDb(), userId, slug));
}
