import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/users", () => ({
  requireOnboardedUser: async () => ({ ok: false, error: { code: "ONBOARDING_REQUIRED" } }),
}));

const { createMeetupAction } = await import("./actions");

describe("Server Action de criação", () => {
  it("bloqueia usuário sem onboarding", async () => {
    const r = await createMeetupAction({ code: null }, {});

    expect(r).toEqual({ code: "ONBOARDING_REQUIRED" });
  });
});
