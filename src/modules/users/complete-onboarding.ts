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

  const inserted = await db.transaction(async (tx) =>
    tx
      .insert(userOnboardings)
      .values({
        userId,
        declaredAutismLevel1OrAutonomous: true,
        declaredAdult: true,
        consentVersion: CONSENT_VERSION,
        consentedAt: new Date(),
      })
      // Idempotente: quem já concluiu mantém o aceite original.
      .onConflictDoNothing({ target: userOnboardings.userId })
      .returning({ userId: userOnboardings.userId }),
  );

  if (inserted.length > 0) {
    logger.info({ event: "user.onboarded", userId });
  }
  return ok({ userId });
}
