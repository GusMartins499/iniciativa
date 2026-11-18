import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

// Ambiente sintético, sem nenhum valor real.
const valid = {
  DATABASE_URL: "postgres://usuario:senha@exemplo.test/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id-teste",
  GOOGLE_CLIENT_SECRET: "client-secret-teste",
  CRON_SECRET: "segredo-do-cron-teste",
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
  it("recusa wsproxy fora do loopback, que levaria a senha do banco sem TLS", () => {
    expect(() =>
      parseServerEnv({ ...valid, DATABASE_WS_PROXY: "proxy.exemplo.test:80/v1" }),
    ).toThrow(/DATABASE_WS_PROXY/);
  });

  it("aceita o wsproxy do e2e", () => {
    for (const proxy of ["localhost:5488/v1", "127.0.0.1:5488/v1"]) {
      expect(parseServerEnv({ ...valid, DATABASE_WS_PROXY: proxy }).DATABASE_WS_PROXY).toBe(proxy);
    }
  });
});
