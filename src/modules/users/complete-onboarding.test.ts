import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
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
    const [registro] = await findOnboardings();
    expect(registro?.consentedAt).not.toBeNull();
    expect(registro?.consentVersion).toBe(CONSENT_VERSION);
    expect(registro?.declaredAutismLevel1OrAutonomous).toBe(true);
    expect(registro?.declaredAdult).toBe(true);
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
    const [primeiro] = await findOnboardings();

    const r = await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(r.ok).toBe(true);
    const registros = await findOnboardings();
    expect(registros).toHaveLength(1);
    expect(registros[0]?.consentedAt).toEqual(primeiro?.consentedAt);
  });
});
