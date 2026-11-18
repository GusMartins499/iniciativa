import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOnboardedUser:
    vi.fn<
      () => Promise<{ ok: true; data: { id: string } } | { ok: false; error: { code: string } }>
    >(),
  joinCommunities: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/modules/users", () => ({ requireOnboardedUser: mocks.requireOnboardedUser }));
vi.mock("@/modules/communities", async () => {
  const schema = await import("@/modules/communities/join-communities-schema");
  return { joinCommunities: mocks.joinCommunities, ...schema };
});
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("@/shared/observability", () => ({ reportError: vi.fn<(...args: unknown[]) => void>() }));

const { joinCommunitiesAction } = await import("./actions");

describe("Server Action do passo de comunidades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOnboardedUser.mockResolvedValue({ ok: true, data: { id: "user-a" } });
    mocks.joinCommunities.mockResolvedValue({ ok: true, data: undefined });
  });

  it("salva as marcadas de uma vez e leva a Próximos", async () => {
    await expect(
      joinCommunitiesAction({ code: null }, { slugs: ["rpg", "cinema"] }),
    ).rejects.toThrow("redirect:/encontros");
    expect(mocks.joinCommunities).toHaveBeenCalledTimes(1);
    expect(mocks.joinCommunities).toHaveBeenCalledWith({}, "user-a", ["rpg", "cinema"]);
  });

  it("bloqueia quem não concluiu o onboarding, sem gravar nada", async () => {
    mocks.requireOnboardedUser.mockResolvedValue({
      ok: false,
      error: { code: "ONBOARDING_REQUIRED" },
    });

    expect(await joinCommunitiesAction({ code: null }, { slugs: ["rpg"] })).toEqual({
      code: "ONBOARDING_REQUIRED",
    });
    expect(mocks.joinCommunities).not.toHaveBeenCalled();
  });

  it("valida a entrada no servidor", async () => {
    expect(await joinCommunitiesAction({ code: null }, { slugs: "rpg" } as never)).toEqual({
      code: "VALIDATION_FAILED",
    });
    expect(mocks.joinCommunities).not.toHaveBeenCalled();
  });

  it("devolve o código do caso de uso quando ele recusa", async () => {
    mocks.joinCommunities.mockResolvedValue({ ok: false, error: { code: "NOT_FOUND" } });

    expect(await joinCommunitiesAction({ code: null }, { slugs: ["xadrez"] })).toEqual({
      code: "NOT_FOUND",
    });
  });

  it("falha inesperada vira mensagem genérica", async () => {
    mocks.joinCommunities.mockRejectedValue(new Error("banco fora"));

    expect(await joinCommunitiesAction({ code: null }, { slugs: ["rpg"] })).toEqual({
      code: "UNEXPECTED",
    });
  });
});
