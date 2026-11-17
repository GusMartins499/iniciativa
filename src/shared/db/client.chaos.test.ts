import { neonConfig } from "@neondatabase/serverless";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// O neonConfig é global do pacote e sobrevive ao resetModules: guarda e restaura.
const original = {
  wsProxy: neonConfig.wsProxy,
  useSecureWebSocket: neonConfig.useSecureWebSocket,
  pipelineConnect: neonConfig.pipelineConnect,
};

const env = {
  DATABASE_URL: "postgres://usuario:senha@exemplo.test/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id-teste",
  GOOGLE_CLIENT_SECRET: "client-secret-teste",
};

async function freshGetDb() {
  vi.resetModules();
  const { getDb } = await import("./client");
  return getDb;
}

beforeEach(() => {
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  vi.stubEnv("DATABASE_WS_PROXY", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  Object.assign(neonConfig, original);
});

describe("chaos: getDb sem wsproxy (produção)", () => {
  it("não mexe no neonConfig: TLS e pipeline continuam como o driver define", async () => {
    (await freshGetDb())();
    expect(neonConfig.wsProxy).toEqual(original.wsProxy);
    expect(neonConfig.useSecureWebSocket).toBe(original.useSecureWebSocket);
    expect(neonConfig.useSecureWebSocket).toBe(true);
    expect(neonConfig.pipelineConnect).toEqual(original.pipelineConnect);
  });
});

describe("chaos: getDb com wsproxy (e2e)", () => {
  it("roteia pelo wsproxy configurado, sem TLS", async () => {
    vi.stubEnv("DATABASE_WS_PROXY", "localhost:5488/v1");
    (await freshGetDb())();
    expect(neonConfig.wsProxy).toBe("localhost:5488/v1");
    expect(neonConfig.useSecureWebSocket).toBe(false);
    expect(neonConfig.pipelineConnect).toBe(false);
  });

  it("chamadas repetidas reaproveitam a mesma instância", async () => {
    vi.stubEnv("DATABASE_WS_PROXY", "localhost:5488/v1");
    const getDb = await freshGetDb();
    expect(getDb()).toBe(getDb());
  });
});
