"use server";

import { redirect } from "next/navigation";
import {
  CONSENT_VERSION,
  completeOnboarding,
  type OnboardingInput,
  onboardingSchema,
} from "@/modules/users";
import { getSessionUser, grantSignupConsent } from "@/shared/auth";
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
      // Ainda sem conta: o aceite vira um cookie assinado e a conta só nasce no
      // cadastro com Google que o formulário dispara em seguida.
      if (!onboardingSchema.safeParse(input).success) return { code: "VALIDATION_FAILED" };
      await grantSignupConsent(CONSENT_VERSION);
      return { code: "SIGN_UP_READY" };
    }
    // Conta que já existe sem autodeclaração (criada antes desta regra): registra aqui.
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
