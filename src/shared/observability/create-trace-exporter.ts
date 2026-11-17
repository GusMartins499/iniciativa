import type { ReadableSpan, SpanExporter } from "@opentelemetry/sdk-trace-base";
import { OTLPHttpProtoTraceExporter, type OTLPExporterConfig } from "@vercel/otel";
import type { TelemetryEnv } from "../env";
import { redactSpanAttributes, redactSpanName } from "./redact-span-attributes";

type CreateOtlpExporter = (config: OTLPExporterConfig) => SpanExporter;

const createOtlpProtoExporter: CreateOtlpExporter = (config) =>
  new OTLPHttpProtoTraceExporter(config);

// Formato da spec do OTel: "chave=valor,chave2=valor2", com o valor codificado em URL.
function parseHeaders(raw: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const pair of (raw ?? "").split(",")) {
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!key) continue;
    try {
      headers[key] = decodeURIComponent(value);
    } catch {
      headers[key] = value;
    }
  }
  return headers;
}

// O endpoint é a base do OTLP; o caminho do sinal de traces vem depois dele.
function tracesUrl(endpoint: string): string {
  return `${endpoint.replace(/\/+$/, "")}/v1/traces`;
}

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
    url: tracesUrl(env.OTEL_EXPORTER_OTLP_ENDPOINT),
    headers: parseHeaders(env.OTEL_EXPORTER_OTLP_HEADERS),
  });
  return new RedactingSpanExporter(inner);
}
