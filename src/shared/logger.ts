import pino, { type DestinationStream, type Logger } from "pino";
import { getTelemetryEnv, logLevel } from "./env";
import { createOtelLogStream } from "./observability/otel-log-stream";
import { SENSITIVE_KEYS } from "./sensitive-keys";

const REDACT_PATHS = SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]);

// Mesma chave do instrumentation.ts: sem endpoint, nem traces nem logs saem do app.
function isTelemetryEnabled(): boolean {
  return Boolean(getTelemetryEnv().OTEL_EXPORTER_OTLP_ENDPOINT);
}

export function createLogger(
  destination?: DestinationStream,
  level: string = logLevel,
  telemetry: boolean = isTelemetryEnabled(),
): Logger {
  const options = {
    level,
    redact: { paths: REDACT_PATHS, remove: true },
    base: undefined,
  };
  if (!telemetry) return pino(options, destination);

  // "trace" nos dois: quem filtra o nível é o logger, não cada saída.
  return pino(
    options,
    pino.multistream([
      { level: "trace", stream: destination ?? pino.destination(1) },
      { level: "trace", stream: createOtelLogStream() },
    ]),
  );
}

export const logger = createLogger();
