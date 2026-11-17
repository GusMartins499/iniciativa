import { redirect } from "next/navigation";
import { CONSENT_VERSION, completeOnboarding } from "@/modules/users";
import { consumeSignupConsent, getSessionUser } from "@/shared/auth";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";

// Destino do Google depois do "Confirmar e entrar", com conta nova ou já existente:
// registra a autodeclaração aceita (idempotente) e entra no app. Sem aceite válido,
// volta para os termos (quem já concluiu o cadastro é mandado de lá para o app).
// Cada desvio fica no log com o motivo, sem dado pessoal.
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    logger.warn({ event: "user.signup_completion_failed", reason: "no_session" });
    redirect("/");
  }
  const consent = await consumeSignupConsent(CONSENT_VERSION);
  if (!consent.valid) {
    logger.warn({
      event: "user.signup_completion_failed",
      userId: sessionUser.id,
      reason: consent.reason,
      cookieNames: consent.cookieNames,
    });
    redirect("/boas-vindas");
  }
  const result = await completeOnboarding(getDb(), sessionUser.id, {
    declaration: true,
    consent: true,
  });
  if (!result.ok) {
    logger.warn({
      event: "user.signup_completion_failed",
      userId: sessionUser.id,
      reason: result.error.code,
    });
    redirect("/boas-vindas");
  }
  logger.info({ event: "user.signup_completed", userId: sessionUser.id });
  redirect("/");
}
