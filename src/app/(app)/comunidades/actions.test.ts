import { describe, expect, it, vi } from "vitest";

const joinCommunity = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());
const leaveCommunity = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<unknown>>());

vi.mock("@/modules/users", () => ({
  requireOnboardedUser: async () => ({ ok: false, error: { code: "ONBOARDING_REQUIRED" } }),
}));
vi.mock("@/modules/communities", () => ({ joinCommunity, leaveCommunity }));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { joinCommunityAction, leaveCommunityAction } = await import("./actions");

describe("Server Actions de comunidade", () => {
  it("bloqueiam usuário sem onboarding antes de entrar ou sair", async () => {
    expect(await joinCommunityAction("rpg", { code: null })).toEqual({
      code: "ONBOARDING_REQUIRED",
    });
    expect(await leaveCommunityAction("rpg", { code: null })).toEqual({
      code: "ONBOARDING_REQUIRED",
    });
    expect(joinCommunity).not.toHaveBeenCalled();
    expect(leaveCommunity).not.toHaveBeenCalled();
  });
});
