import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

// Ambiente sintético — nenhum valor real.
const valid = {
  DATABASE_URL: "postgres://usuario:senha@exemplo.test/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id-teste",
  GOOGLE_CLIENT_SECRET: "client-secret-teste",
};

describe("chaos: DATABASE_WS_PROXY ausente", () => {
  // O .env.example traz `DATABASE_WS_PROXY=`; o dotenv do Next carrega isso como "".
  it("trata o valor vazio do .env.example como ausente, sem derrubar o boot", () => {
    const env = parseServerEnv({ ...valid, DATABASE_WS_PROXY: "" });
    expect(env.DATABASE_WS_PROXY).toBeUndefined();
  });
});

describe("chaos: DATABASE_WS_PROXY hostil", () => {
  // ws-proxy.ts desliga TLS e o pipeline da senha porque "o proxy é local".
  // oxlint-disable-next-line vitest/no-disabled-tests -- CHAOS: achado em código já mergeado
  it.skip("recusa wsproxy fora do loopback, que levaria a senha do banco sem TLS", () => {
    // CHAOS: 💀 KILLED (contestável) — #32
    expect(() =>
      parseServerEnv({ ...valid, DATABASE_WS_PROXY: "proxy.exemplo.test:80/v1" }),
    ).toThrow(/DATABASE_WS_PROXY/);
  });
});
