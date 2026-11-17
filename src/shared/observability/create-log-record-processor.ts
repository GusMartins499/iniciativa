import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  BatchLogRecordProcessor,
  type LogRecordExporter,
  type LogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import type { SpanProcessor } from "@opentelemetry/sdk-trace-base";
import type { TelemetryEnv } from "../env";
import { otlpSignalUrl, parseOtlpHeaders } from "./otlp-config";

type OtlpConfig = { url: string; headers: Record<string, string> };
type CreateOtlpExporter = (config: OtlpConfig) => LogRecordExporter;

const createOtlpHttpExporter: CreateOtlpExporter = (config) => new OTLPLogExporter(config);

// Sem endpoint, não há processor: dev local, Vitest, e2e e CI seguem sem telemetria.
// O log chega aqui já redigido pelo pino (src/shared/observability/otel-log-stream.ts).
export function createLogRecordProcessor(
  env: Pick<TelemetryEnv, "OTEL_EXPORTER_OTLP_ENDPOINT" | "OTEL_EXPORTER_OTLP_HEADERS">,
  createOtlpExporter: CreateOtlpExporter = createOtlpHttpExporter,
): LogRecordProcessor | undefined {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) return undefined;
  const exporter = createOtlpExporter({
    url: otlpSignalUrl(env.OTEL_EXPORTER_OTLP_ENDPOINT, "logs"),
    headers: parseOtlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS),
  });
  return new BatchLogRecordProcessor({ exporter });
}

// O @vercel/otel 2.3.0 só faz o flush dos span processors no fim da requisição (via
// waitUntil); o dos logs ele não faz, e os últimos logs da função serverless se perderiam.
// Este span processor não mexe em span nenhum: só pega carona nesse flush.
export function createLogFlushSpanProcessor(logRecordProcessor: LogRecordProcessor): SpanProcessor {
  return {
    onStart() {},
    onEnd() {},
    forceFlush: () => logRecordProcessor.forceFlush(),
    // Quem desliga o processor de logs é o LoggerProvider do @vercel/otel.
    shutdown: async () => {},
  };
}
