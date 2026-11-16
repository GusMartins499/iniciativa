"use server";

import { redirect } from "next/navigation";
import { completeOnboarding, type OnboardingInput } from "@/modules/users";
import { getSessionUser } from "@/shared/auth";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { OnboardingState } from "./state";

export async function completeOnboardingAction(
  _state: OnboardingState,
  input: OnboardingInput,
): Promise<OnboardingState> {
  let succeeded = false;
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return { code: "UNAUTHENTICATED" };
    }
    // A entrada vem do cliente: o caso de uso valida de novo com o mesmo schema Zod.
    const result = await completeOnboarding(getDb(), sessionUser.id, input);
    if (!result.ok) {
      return { code: result.error.code };
    }
    succeeded = true;
  } catch (error) {
    logger.error({ event: "user.onboarding_failed", err: error });
    return { code: "UNEXPECTED" };
  }
  // redirect() lança internamente; fica fora do try para não ser tratado como falha.
  if (succeeded) {
    redirect("/");
  }
  return { code: "UNEXPECTED" };
}
