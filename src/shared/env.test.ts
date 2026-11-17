import { describe, expect, it } from "vitest";
import { parseLogLevel, parseServerEnv, parseTelemetryEnv } from "./env";

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
    expect(parseServerEnv(valid)).toEqual({ ...valid, OTEL_SERVICE_NAME: "iniciativa" });
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

  it("aceita as variáveis de OTEL ausentes", () => {
    // A linha vazia do .env.example chega como "": vale como ausente.
    const empty = {
      OTEL_EXPORTER_OTLP_ENDPOINT: "",
      OTEL_EXPORTER_OTLP_HEADERS: "",
      OTEL_SERVICE_NAME: "",
    };
    for (const source of [valid, { ...valid, ...empty }]) {
      const env = parseServerEnv(source);
      expect(env.OTEL_EXPORTER_OTLP_ENDPOINT).toBeUndefined();
      expect(env.OTEL_EXPORTER_OTLP_HEADERS).toBeUndefined();
      expect(env.OTEL_SERVICE_NAME).toBe("iniciativa");
    }
  });

  it("recusa OTEL_EXPORTER_OTLP_ENDPOINT que não é URL", () => {
    const error = captureError(() =>
      parseServerEnv({
        ...valid,
        OTEL_EXPORTER_OTLP_ENDPOINT: "otlp.exemplo.test",
        OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Basic segredo-otel",
      }),
    );
    expect(error.message).toContain("OTEL_EXPORTER_OTLP_ENDPOINT");
    expect(error.message).not.toContain("segredo-otel");
  });

  it("lê as variáveis de OTEL sem exigir as do banco e do login", () => {
    expect(
      parseTelemetryEnv({
        OTEL_EXPORTER_OTLP_ENDPOINT: "https://otlp.exemplo.test/otlp",
        OTEL_SERVICE_NAME: "outro",
      }),
    ).toEqual({
      OTEL_EXPORTER_OTLP_ENDPOINT: "https://otlp.exemplo.test/otlp",
      OTEL_EXPORTER_OTLP_HEADERS: undefined,
      OTEL_SERVICE_NAME: "outro",
    });
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
