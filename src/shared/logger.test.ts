import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLogger } from "./logger";

function memoryDestination() {
  const lines: string[] = [];
  return {
    lines,
    write(chunk: string) {
      lines.push(chunk);
    },
  };
}

describe("shared/logger", () => {
  it("oculta campos de PII no log", () => {
    const destination = memoryDestination();
    const logger = createLogger(destination, "info");

    logger.info({ event: "x", userId: "u1", email: "a@b.c", name: "Ana" });

    const output = destination.lines.join("");
    expect(output).toContain('"userId":"u1"');
    expect(output).not.toContain("a@b.c");
    expect(output).not.toContain("Ana");
  });

  it("oculta PII aninhada e dados da autodeclaração", () => {
    const destination = memoryDestination();
    const logger = createLogger(destination, "info");

    logger.info({
      event: "y",
      user: { email: "z@y.x", image: "https://foto" },
      declaration: { autism: true },
      consent: { version: "v1" },
    });

    const output = destination.lines.join("");
    expect(output).toContain('"event":"y"');
    expect(output).not.toContain("z@y.x");
    expect(output).not.toContain("https://foto");
    expect(output).not.toContain("autism");
    expect(output).not.toContain('"v1"');
  });

  describe("exportação por OTLP", () => {
    let exporter: InMemoryLogRecordExporter;

    beforeEach(() => {
      exporter = new InMemoryLogRecordExporter();
      logs.setGlobalLoggerProvider(
        new LoggerProvider({ processors: [new SimpleLogRecordProcessor({ exporter })] }),
      );
    });

    afterEach(() => {
      logs.disable();
    });

    it("envia para o exporter OTLP o mesmo log, já sem PII", () => {
      const destination = memoryDestination();
      const logger = createLogger(destination, "info", true);

      logger.info({
        event: "rsvp.confirmed",
        userId: "u1",
        meetupId: "m1",
        email: "a@b.c",
        user: { name: "Ana" },
        declaration: { autism: true },
      });

      expect(destination.lines.join("")).toContain('"event":"rsvp.confirmed"');
      const records = exporter.getFinishedLogRecords();
      expect(records).toHaveLength(1);
      const record = records[0];
      expect(record?.body).toBe("rsvp.confirmed");
      expect(record?.attributes).toEqual({ userId: "u1", meetupId: "m1", user: {} });
      const exported = JSON.stringify({ body: record?.body, attributes: record?.attributes });
      expect(exported).not.toContain("a@b.c");
      expect(exported).not.toContain("Ana");
      expect(exported).not.toContain("autism");
    });

    it("mapeia os níveis do pino para severityNumber do OpenTelemetry", () => {
      const logger = createLogger(memoryDestination(), "trace", true);

      logger.trace("t");
      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");
      logger.fatal("f");

      const records = exporter.getFinishedLogRecords();
      expect(
        records.map((record) => [record.body, record.severityNumber, record.severityText]),
      ).toEqual([
        ["t", SeverityNumber.TRACE, "trace"],
        ["d", SeverityNumber.DEBUG, "debug"],
        ["i", SeverityNumber.INFO, "info"],
        ["w", SeverityNumber.WARN, "warn"],
        ["e", SeverityNumber.ERROR, "error"],
        ["f", SeverityNumber.FATAL, "fatal"],
      ]);
    });

    it("não envia nada por OTLP quando a telemetria está desligada", () => {
      const destination = memoryDestination();
      const logger = createLogger(destination, "info", false);

      logger.info({ event: "meetup.created", userId: "u1" });

      expect(destination.lines.join("")).toContain('"event":"meetup.created"');
      expect(exporter.getFinishedLogRecords()).toHaveLength(0);
    });
  });
});
