import type { LogRecordExporter, LogRecordProcessor } from "@opentelemetry/sdk-logs";
import { describe, expect, it, vi } from "vitest";
import {
  createLogFlushSpanProcessor,
  createLogRecordProcessor,
} from "./create-log-record-processor";

// Endpoint e headers sintéticos, nenhum valor real.
const endpoint = "https://otlp.exemplo.test/otlp";

type CreateOtlp = (config: { url: string; headers: Record<string, string> }) => LogRecordExporter;

function fakeExporter(): LogRecordExporter {
  return {
    export: (_records, done) => done({ code: 0 }),
    shutdown: async () => {},
    forceFlush: async () => {},
  };
}

describe("shared/observability/createLogRecordProcessor", () => {
  it("não cria processor quando OTEL_EXPORTER_OTLP_ENDPOINT não está definido", () => {
    const createOtlp = vi.fn<CreateOtlp>();

    expect(
      createLogRecordProcessor({ OTEL_EXPORTER_OTLP_HEADERS: "a=b" }, createOtlp),
    ).toBeUndefined();
    expect(createOtlp).not.toHaveBeenCalled();
  });

  it("cria o exporter OTLP de logs em /v1/logs com os headers do env", () => {
    const createOtlp = vi.fn<CreateOtlp>(fakeExporter);

    const processor = createLogRecordProcessor(
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: `${endpoint}/`,
        OTEL_EXPORTER_OTLP_HEADERS: "X-Equipe=piloto",
      },
      createOtlp,
    );

    expect(processor).toBeDefined();
    expect(createOtlp).toHaveBeenCalledWith({
      url: `${endpoint}/v1/logs`,
      headers: { "X-Equipe": "piloto" },
    });
  });
});

describe("shared/observability/createLogFlushSpanProcessor", () => {
  it("faz o flush dos logs junto com o flush dos spans, sem desligar o processor", async () => {
    const logs: LogRecordProcessor = {
      onEmit: vi.fn<LogRecordProcessor["onEmit"]>(),
      forceFlush: vi.fn<() => Promise<void>>(async () => {}),
      shutdown: vi.fn<() => Promise<void>>(async () => {}),
    };
    const processor = createLogFlushSpanProcessor(logs);

    await processor.forceFlush();
    await processor.shutdown();

    expect(logs.forceFlush).toHaveBeenCalledOnce();
    expect(logs.shutdown).not.toHaveBeenCalled();
  });
});
