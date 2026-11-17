import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import type { OTLPExporterConfig } from "@vercel/otel";
import { describe, expect, it, vi } from "vitest";
import { createTraceExporter } from "./create-trace-exporter";

// Endpoint e token sintéticos, nenhum valor real.
const endpoint = "https://otlp.exemplo.test/otlp";

type CreateOtlp = (config: OTLPExporterConfig) => SpanExporter;
type ExportDone = Parameters<SpanExporter["export"]>[1];

function fakeExporter() {
  const exported: ReadableSpan[][] = [];
  const exporter: SpanExporter = {
    export: (spans, done) => {
      exported.push(spans);
      done({ code: 0 });
    },
    shutdown: vi.fn<() => Promise<void>>(async () => {}),
    forceFlush: vi.fn<() => Promise<void>>(async () => {}),
  };
  return { exporter, exported };
}

function fakeSpan(overrides: Partial<ReadableSpan>): ReadableSpan {
  return {
    name: "span",
    kind: 0,
    spanContext: () => ({ traceId: "t", spanId: "s", traceFlags: 1 }),
    startTime: [0, 0],
    endTime: [0, 1],
    status: { code: 0 },
    attributes: {},
    links: [],
    events: [],
    duration: [0, 1],
    ended: true,
    resource: {} as ReadableSpan["resource"],
    instrumentationScope: { name: "teste" },
    droppedAttributesCount: 0,
    droppedEventsCount: 0,
    droppedLinksCount: 0,
    ...overrides,
  };
}

describe("shared/observability/createTraceExporter", () => {
  it("não cria exporter quando OTEL_EXPORTER_OTLP_ENDPOINT não está definido", () => {
    const createOtlp = vi.fn<CreateOtlp>();

    expect(createTraceExporter({ OTEL_EXPORTER_OTLP_HEADERS: "a=b" }, createOtlp)).toBeUndefined();
    expect(createOtlp).not.toHaveBeenCalled();
  });

  it("cria o exporter OTLP com o endpoint e os headers do env", () => {
    const createOtlp = vi.fn<CreateOtlp>(() => fakeExporter().exporter);

    const exporter = createTraceExporter(
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: `${endpoint}/`,
        OTEL_EXPORTER_OTLP_HEADERS: "Authorization=Basic%20dGVzdGU6dGVzdGU=, X-Scope = equipe",
      },
      createOtlp,
    );

    expect(exporter).toBeDefined();
    expect(createOtlp).toHaveBeenCalledWith({
      url: `${endpoint}/v1/traces`,
      headers: { Authorization: "Basic dGVzdGU6dGVzdGU=", "X-Scope": "equipe" },
    });
  });

  it("aplica o filtro de PII em cada span antes de exportar", () => {
    const { exporter: inner, exported } = fakeExporter();
    const exporter = createTraceExporter({ OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }, () => inner);
    const done = vi.fn<ExportDone>();

    exporter?.export(
      [
        fakeSpan({
          name: "fetch GET https://oauth.exemplo.test/token?code=abc",
          attributes: {
            "http.url": "https://oauth.exemplo.test/token?code=abc",
            email: "a@b.test",
          },
          events: [
            { name: "evento", time: [0, 0], attributes: { "user.name": "Ana", userId: "u1" } },
          ],
        }),
      ],
      done,
    );

    const span = exported[0]?.[0];
    expect(span?.name).toBe("fetch GET https://oauth.exemplo.test/token");
    expect(span?.attributes).toEqual({ "http.url": "https://oauth.exemplo.test/token" });
    expect(span?.events[0]?.attributes).toEqual({ userId: "u1" });
    expect(span?.spanContext().traceId).toBe("t");
    expect(done).toHaveBeenCalledWith({ code: 0 });
  });

  it("repassa shutdown e forceFlush ao exporter OTLP", async () => {
    const { exporter: inner } = fakeExporter();
    const exporter = createTraceExporter({ OTEL_EXPORTER_OTLP_ENDPOINT: endpoint }, () => inner);

    await exporter?.forceFlush?.();
    await exporter?.shutdown();

    expect(inner.forceFlush).toHaveBeenCalled();
    expect(inner.shutdown).toHaveBeenCalled();
  });
});
