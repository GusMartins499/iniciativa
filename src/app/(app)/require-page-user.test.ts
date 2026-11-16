import { describe, expect, it, vi } from "vitest";

const guardResult = vi.hoisted(() => ({
  value: { ok: false, error: { code: "ONBOARDING_REQUIRED" } } as unknown,
}));

vi.mock("@/modules/users", () => ({ requireOnboardedUser: async () => guardResult.value }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

const { requirePageUser } = await import("./require-page-user");

// Guard usado por /meus-encontros e pelas demais páginas protegidas.
describe("requirePageUser", () => {
  it("bloqueia usuário sem onboarding: redireciona para /boas-vindas", async () => {
    guardResult.value = { ok: false, error: { code: "ONBOARDING_REQUIRED" } };
    await expect(requirePageUser()).rejects.toThrow("redirect:/boas-vindas");
  });

  it("redireciona visitante sem sessão para /entrar", async () => {
    guardResult.value = { ok: false, error: { code: "UNAUTHENTICATED" } };
    await expect(requirePageUser()).rejects.toThrow("redirect:/entrar");
  });
});
