import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import { OTLPHttpProtoTraceExporter, type OTLPExporterConfig } from "@vercel/otel";
import type { TelemetryEnv } from "../env";
import { otlpSignalUrl, parseOtlpHeaders } from "./otlp-config";
import { redactSpanAttributes, redactSpanName } from "./redact-span-attributes";

type CreateOtlpExporter = (config: OTLPExporterConfig) => SpanExporter;

const createOtlpProtoExporter: CreateOtlpExporter = (config) =>
  new OTLPHttpProtoTraceExporter(config);

function redactSpan(span: ReadableSpan): ReadableSpan {
  return {
    name: redactSpanName(span.name),
    kind: span.kind,
    spanContext: () => span.spanContext(),
    parentSpanContext: span.parentSpanContext,
    startTime: span.startTime,
    endTime: span.endTime,
    status: span.status,
    attributes: redactSpanAttributes(span.attributes),
    links: span.links.map((link) => ({
      ...link,
      attributes: link.attributes && redactSpanAttributes(link.attributes),
    })),
    events: span.events.map((event) => ({
      ...event,
      attributes: event.attributes && redactSpanAttributes(event.attributes),
    })),
    duration: span.duration,
    ended: span.ended,
    resource: span.resource,
    instrumentationScope: span.instrumentationScope,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount,
  };
}

// Nenhum span sai do app sem passar pelo filtro de PII.
class RedactingSpanExporter implements SpanExporter {
  constructor(private readonly inner: SpanExporter) {}

  export(spans: ReadableSpan[], resultCallback: Parameters<SpanExporter["export"]>[1]): void {
    this.inner.export(spans.map(redactSpan), resultCallback);
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }

  async forceFlush(): Promise<void> {
    await this.inner.forceFlush?.();
  }
}

// Sem endpoint, não há exporter: dev local, Vitest, e2e e CI seguem sem telemetria.
export function createTraceExporter(
  env: Pick<TelemetryEnv, "OTEL_EXPORTER_OTLP_ENDPOINT" | "OTEL_EXPORTER_OTLP_HEADERS">,
  createOtlpExporter: CreateOtlpExporter = createOtlpProtoExporter,
): SpanExporter | undefined {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) return undefined;
  const inner = createOtlpExporter({
    url: otlpSignalUrl(env.OTEL_EXPORTER_OTLP_ENDPOINT, "traces"),
    headers: parseOtlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS),
  });
  return new RedactingSpanExporter(inner);
}
