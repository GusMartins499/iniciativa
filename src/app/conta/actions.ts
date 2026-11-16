"use server";

import { redirect } from "next/navigation";
import { deleteAccount, requireOnboardedUser } from "@/modules/users";
import { clearAuthCookies } from "@/shared/auth";
import { getDb } from "@/shared/db";
import type { DeleteAccountState } from "./state";

export async function deleteAccountAction(_state: DeleteAccountState): Promise<DeleteAccountState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    // A falha já é logada no caso de uso, com o userId.
    await deleteAccount(getDb(), guard.data.id);
    await clearAuthCookies();
  } catch {
    return { code: "UNEXPECTED" };
  }
  // redirect() lança internamente; fica fora do try para não ser tratado como falha.
  redirect("/entrar?deleted=1");
}
