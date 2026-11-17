import { eq } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { CONSENT_VERSION } from "./copy";
import { onboardingSchema } from "./onboarding-schema";
import { userOnboardings } from "./schema";

export async function completeOnboarding(
  db: Database,
  userId: string,
  input: unknown,
): Promise<Result<{ userId: string }, "VALIDATION_FAILED">> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn({ event: "user.onboarding_rejected", userId, code: "VALIDATION_FAILED" });
    return err("VALIDATION_FAILED");
  }

  const outcome = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ consentVersion: userOnboardings.consentVersion })
      .from(userOnboardings)
      .where(eq(userOnboardings.userId, userId))
      .for("update");
    if (!current) {
      const inserted = await tx
        .insert(userOnboardings)
        .values({
          userId,
          declaredAutismLevel1OrAutonomous: true,
          declaredAdult: true,
          consentVersion: CONSENT_VERSION,
          consentedAt: new Date(),
        })
        // Dois envios ao mesmo tempo: o segundo não duplica nem falha.
        .onConflictDoNothing({ target: userOnboardings.userId })
        .returning({ userId: userOnboardings.userId });
      return inserted.length > 0 ? "onboarded" : "unchanged";
    }
    // Idempotente: quem já aceitou a versão atual mantém o aceite original.
    if (current.consentVersion === CONSENT_VERSION) return "unchanged";
    await tx
      .update(userOnboardings)
      .set({
        declaredAutismLevel1OrAutonomous: true,
        declaredAdult: true,
        consentVersion: CONSENT_VERSION,
        consentedAt: new Date(),
      })
      .where(eq(userOnboardings.userId, userId));
    return "renewed";
  });

  if (outcome === "onboarded") {
    logger.info({ event: "user.onboarded", userId });
  } else if (outcome === "renewed") {
    logger.info({ event: "user.consent_renewed", userId });
  }
  return ok({ userId });
}
