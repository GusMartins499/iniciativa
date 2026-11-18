import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn<() => Promise<{ id: string; name: string } | null>>(),
  consumeSignupConsent:
    vi.fn<
      (version: string) => Promise<{ valid: boolean; reason?: string; cookieNames?: string[] }>
    >(),
  completeOnboarding: vi.fn<() => Promise<{ ok: boolean; data?: { outcome: string } }>>(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/shared/auth", () => ({
  getSessionUser: mocks.getSessionUser,
  consumeSignupConsent: mocks.consumeSignupConsent,
}));
vi.mock("@/modules/users", () => ({
  CONSENT_VERSION: "v-teste",
  completeOnboarding: mocks.completeOnboarding,
}));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("@/shared/logger", () => ({
  logger: { info: vi.fn<(entry: object) => void>(), warn: vi.fn<(entry: object) => void>() },
}));

const { GET } = await import("./route");

describe("conclusão do cadastro depois do Google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionUser.mockResolvedValue({ id: "novo", name: "Pessoa" });
    mocks.completeOnboarding.mockResolvedValue({ ok: true, data: { outcome: "onboarded" } });
  });

  it("conta nova registra a autodeclaração e segue para o passo de comunidades", async () => {
    mocks.consumeSignupConsent.mockResolvedValue({ valid: true });

    await expect(GET()).rejects.toThrow("redirect:/boas-vindas/comunidades");
    expect(mocks.consumeSignupConsent).toHaveBeenCalledWith("v-teste");
    expect(mocks.completeOnboarding).toHaveBeenCalledWith({}, "novo", {
      declaration: true,
      consent: true,
    });
  });

  it.each(["unchanged", "renewed"])(
    "quem já tinha conta (%s) entra direto no app, sem o passo de comunidades",
    async (outcome) => {
      mocks.consumeSignupConsent.mockResolvedValue({ valid: true });
      mocks.completeOnboarding.mockResolvedValue({ ok: true, data: { outcome } });

      await expect(GET()).rejects.toThrow(/^redirect:\/$/);
    },
  );

  it("sem aceite válido, volta para os termos sem registrar nada", async () => {
    mocks.consumeSignupConsent.mockResolvedValue({
      valid: false,
      reason: "missing",
      cookieNames: [],
    });

    await expect(GET()).rejects.toThrow("redirect:/boas-vindas");
    expect(mocks.completeOnboarding).not.toHaveBeenCalled();
  });

  it("sem sessão, volta para a tela inicial", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await expect(GET()).rejects.toThrow("redirect:/");
  });
});
