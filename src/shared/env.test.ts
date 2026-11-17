import { describe, expect, it } from "vitest";
import { parseLogLevel, parseServerEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://usuario:senha@exemplo.test/db",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id-teste",
  GOOGLE_CLIENT_SECRET: "client-secret-teste",
};

function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error) return error;
  }
  throw new Error("esperava um erro");
}

describe("shared/env", () => {
  it("devolve as variáveis validadas", () => {
    expect(parseServerEnv(valid)).toEqual(valid);
  });

  it("lista todas as variáveis ausentes de uma vez", () => {
    expect(() => parseServerEnv({ DATABASE_URL: valid.DATABASE_URL })).toThrow(
      /BETTER_AUTH_SECRET.*BETTER_AUTH_URL.*GOOGLE_CLIENT_ID.*GOOGLE_CLIENT_SECRET/,
    );
  });

  it("recusa URL inválida", () => {
    expect(() => parseServerEnv({ ...valid, BETTER_AUTH_URL: "localhost" })).toThrow(
      /BETTER_AUTH_URL/,
    );
  });

  it("recusa segredo curto", () => {
    expect(() => parseServerEnv({ ...valid, BETTER_AUTH_SECRET: "curto" })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it("aceita o wsproxy só sem protocolo", () => {
    expect(parseServerEnv({ ...valid, DATABASE_WS_PROXY: "localhost:5488/v1" })).toMatchObject({
      DATABASE_WS_PROXY: "localhost:5488/v1",
    });
    expect(() => parseServerEnv({ ...valid, DATABASE_WS_PROXY: "ws://localhost:5488/v1" })).toThrow(
      /DATABASE_WS_PROXY/,
    );
  });

  it("usa info como nível de log quando LOG_LEVEL está ausente ou vazio", () => {
    expect(parseLogLevel(undefined)).toBe("info");
    expect(parseLogLevel("")).toBe("info");
  });

  it("aceita os níveis do pino e recusa os demais", () => {
    expect(parseLogLevel("debug")).toBe("debug");
    expect(() => parseLogLevel("verbose")).toThrow(/Invalid option/);
  });

  it("nunca coloca os valores na mensagem de erro", () => {
    const error = captureError(() =>
      parseServerEnv({ ...valid, BETTER_AUTH_SECRET: "segredo-curto" }),
    );
    expect(error.message).toContain("BETTER_AUTH_SECRET");
    expect(error.message).not.toContain("segredo-curto");
  });
});
