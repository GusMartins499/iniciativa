import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

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

  it("nunca coloca os valores na mensagem de erro", () => {
    const error = captureError(() =>
      parseServerEnv({ ...valid, BETTER_AUTH_SECRET: "segredo-curto" }),
    );
    expect(error.message).toContain("BETTER_AUTH_SECRET");
    expect(error.message).not.toContain("segredo-curto");
  });
});
