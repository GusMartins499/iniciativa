import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { completeOnboarding } from "./complete-onboarding";
import {
  hasCompletedOnboarding,
  hasOutdatedConsent,
  requireOnboardedUser,
} from "./require-onboarded-user";
import { userOnboardings } from "./schema";
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

  it("pede o onboarding de novo a quem aceitou uma versão anterior do termo", async () => {
    await db.insert(userOnboardings).values({
      userId,
      declaredAutismLevel1OrAutonomous: true,
      declaredAdult: true,
      consentVersion: "v0.1-provisorio",
      consentedAt: new Date("2026-10-01T12:00:00Z"),
    });

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
    expect(await hasCompletedOnboarding(db, userId)).toBe(false);
    expect(await hasOutdatedConsent(db, userId)).toBe(true);
  });

  it("não marca como desatualizado quem nunca aceitou nem quem aceitou a versão atual", async () => {
    expect(await hasOutdatedConsent(db, userId)).toBe(false);

    await completeOnboarding(db, userId, { declaration: true, consent: true });

    expect(await hasOutdatedConsent(db, userId)).toBe(false);
  });

  it("leva quem aceitou o termo v1.1 ao reaceite do termo v2 antes de ver qualquer encontro", async () => {
    await db.insert(userOnboardings).values({
      userId,
      declaredAutismLevel1OrAutonomous: true,
      declaredAdult: true,
      consentVersion: "v1.1",
      consentedAt: new Date("2026-11-01T12:00:00Z"),
    });

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
    expect(await hasOutdatedConsent(db, userId)).toBe(true);
  });
});
