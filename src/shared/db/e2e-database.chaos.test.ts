import { afterEach, describe, expect, it, vi } from "vitest";

// O global-setup do e2e apaga o schema do DATABASE_URL: o playwright.config.ts tem de
// trocar qualquer banco herdado do ambiente pelo Postgres descartável do e2e/compose.yaml.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("chaos: DATABASE_URL herdado no e2e", () => {
  it("sobrescreve um banco que já estava no ambiente", async () => {
    vi.stubEnv("DATABASE_URL", "postgres://usuario:senha@banco-dev.exemplo.test/db");
    vi.stubEnv("DATABASE_WS_PROXY", "outro-proxy:9999/v1");
    vi.stubEnv("BETTER_AUTH_URL", "https://app.exemplo.test");
    vi.resetModules();
    await import("../../../playwright.config");

    expect(process.env.DATABASE_URL).toBe("postgres://iniciativa@postgres:5432/iniciativa_e2e");
    expect(process.env.DATABASE_WS_PROXY).toBe("localhost:5488/v1");
    expect(process.env.BETTER_AUTH_URL).toBe("http://localhost:3000");
  });
});
