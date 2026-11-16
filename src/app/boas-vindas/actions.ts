"use server";

import { redirect } from "next/navigation";
import { completeOnboarding } from "@/modules/users";
import { getSessionUser } from "@/shared/auth";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { OnboardingState } from "./state";

export async function completeOnboardingAction(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  let succeeded = false;
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return { code: "UNAUTHENTICATED" };
    }
    const result = await completeOnboarding(getDb(), sessionUser.id, {
      declaration: formData.get("declaration") === "on",
      consent: formData.get("consent") === "on",
    });
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
