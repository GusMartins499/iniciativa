import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { completeOnboarding } from "./complete-onboarding";
import { requireOnboardedUser } from "./require-onboarded-user";
import { insertTestUser } from "@/shared/auth/test-helpers";

let db: Database;
let userId: string;

beforeEach(async () => {
  db = await createTestDb();
  userId = await insertTestUser(db);
});

describe("requireOnboardedUser", () => {
  it("bloqueia visitante sem sessão", async () => {
    const r = await requireOnboardedUser({ db, getSessionUser: async () => null });

    expect(r).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("bloqueia usuário autenticado sem onboarding", async () => {
    const r = await requireOnboardedUser({
      db,
      getSessionUser: async () => ({
        id: userId,
        name: "Pessoa Teste",
        email: "pessoa-teste@exemplo.test",
        image: null,
      }),
    });

    expect(r).toEqual({ ok: false, error: { code: "ONBOARDING_REQUIRED" } });
  });

  it("libera usuário com onboarding concluído", async () => {
    await completeOnboarding(db, userId, { declaration: true, consent: true });

    const r = await requireOnboardedUser({
      db,
      getSessionUser: async () => ({
        id: userId,
        name: "Pessoa Teste",
        email: "pessoa-teste@exemplo.test",
        image: null,
      }),
    });

    expect(r).toEqual({
      ok: true,
      data: {
        id: userId,
        name: "Pessoa Teste",
        email: "pessoa-teste@exemplo.test",
        image: null,
      },
    });
  });
});
