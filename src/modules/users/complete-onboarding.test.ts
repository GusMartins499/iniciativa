import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
import { CONSENT_VERSION } from "./copy";
import { completeOnboarding } from "./complete-onboarding";
import { userOnboardings } from "./schema";
import { insertTestUser } from "@/shared/auth/test-helpers";

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = await insertTestUser(db);
});

async function findOnboardings() {
  return db.select().from(userOnboardings).where(eq(userOnboardings.userId, userId));
}

describe("users.completeOnboarding", () => {
  it("registra autodeclaração e consentimento quando os dois são aceitos", async () => {
    const r = await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(r.ok).toBe(true);
    const [record] = await findOnboardings();
    expect(record?.consentedAt).not.toBeNull();
    expect(record?.consentVersion).toBe(CONSENT_VERSION);
    expect(record?.declaredAutismLevel1OrAutonomous).toBe(true);
    expect(record?.declaredAdult).toBe(true);
  });

  it("recusa quando a autodeclaração não foi marcada", async () => {
    const r = await completeOnboarding(db, userId, { declaration: false, consent: true });

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
    expect(await findOnboardings()).toHaveLength(0);
  });

  it("recusa quando o consentimento não foi marcado", async () => {
    const r = await completeOnboarding(db, userId, { declaration: true, consent: false });

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
    expect(await findOnboardings()).toHaveLength(0);
  });

  it("recusa entrada que não é booleana", async () => {
    const r = await completeOnboarding(db, userId, { declaration: "on", consent: true });

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("é idempotente para quem já concluiu o onboarding", async () => {
    await completeOnboarding(db, userId, { declaration: true, consent: true });
    const [first] = await findOnboardings();

    const r = await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(r.ok).toBe(true);
    const records = await findOnboardings();
    expect(records).toHaveLength(1);
    expect(records[0]?.consentedAt).toEqual(first?.consentedAt);
  });

  it("atualiza versão e data do aceite de quem aceitou uma versão anterior do termo", async () => {
    const oldConsentedAt = new Date("2026-10-01T12:00:00Z");
    await db.insert(userOnboardings).values({
      userId,
      declaredAutismLevel1OrAutonomous: true,
      declaredAdult: true,
      consentVersion: "v0.1-provisorio",
      consentedAt: oldConsentedAt,
    });

    const r = await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(r.ok).toBe(true);
    const records = await findOnboardings();
    expect(records).toHaveLength(1);
    expect(records[0]?.consentVersion).toBe(CONSENT_VERSION);
    expect(records[0]?.consentedAt.getTime()).toBeGreaterThan(oldConsentedAt.getTime());
  });

  it("diz se a conta acabou de concluir o onboarding, renovou o aceite ou já estava em dia", async () => {
    const first = await completeOnboarding(db, userId, { declaration: true, consent: true });
    const again = await completeOnboarding(db, userId, { declaration: true, consent: true });
    await db
      .update(userOnboardings)
      .set({ consentVersion: "v0.1-provisorio" })
      .where(eq(userOnboardings.userId, userId));
    const renewed = await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(first).toEqual({ ok: true, data: { userId, outcome: "onboarded" } });
    expect(again).toEqual({ ok: true, data: { userId, outcome: "unchanged" } });
    expect(renewed).toEqual({ ok: true, data: { userId, outcome: "renewed" } });
  });

  it("registra a versão do termo nos eventos de aceite, para contar os aceites por versão", async () => {
    const info = vi.spyOn(logger, "info");

    await completeOnboarding(db, userId, { declaration: true, consent: true });
    await db
      .update(userOnboardings)
      .set({ consentVersion: "v1.1" })
      .where(eq(userOnboardings.userId, userId));
    await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(info).toHaveBeenCalledWith({
      event: "user.onboarded",
      userId,
      consentVersion: CONSENT_VERSION,
    });
    expect(info).toHaveBeenCalledWith({
      event: "user.consent_renewed",
      userId,
      consentVersion: CONSENT_VERSION,
    });
    info.mockRestore();
  });
});
