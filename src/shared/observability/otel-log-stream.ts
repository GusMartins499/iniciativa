import { context } from "@opentelemetry/api";
import { type AnyValueMap, logs, SeverityNumber } from "@opentelemetry/api-logs";
import type { DestinationStream } from "pino";

const SCOPE = "iniciativa";

// Níveis numéricos do pino (10..60) para a escala do OpenTelemetry.
const SEVERITY: Record<number, { number: SeverityNumber; text: string }> = {
  10: { number: SeverityNumber.TRACE, text: "trace" },
  20: { number: SeverityNumber.DEBUG, text: "debug" },
  30: { number: SeverityNumber.INFO, text: "info" },
  40: { number: SeverityNumber.WARN, text: "warn" },
  50: { number: SeverityNumber.ERROR, text: "error" },
  60: { number: SeverityNumber.FATAL, text: "fatal" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Recebe a linha que o pino já serializou e redigiu: a redação de PII do logger vale
// também para o que sai por OTLP, sem uma segunda lista para manter.
function emit(line: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return;
  }
  if (!isRecord(parsed)) return;

  const { level, time, ...fields } = parsed;
  const bodyKey = typeof fields.event === "string" ? "event" : "msg";
  const body = fields[bodyKey];
  delete fields[bodyKey];
  const severity = typeof level === "number" ? SEVERITY[level] : undefined;

  logs.getLogger(SCOPE).emit({
    body: typeof body === "string" ? body : undefined,
    severityNumber: severity?.number,
    severityText: severity?.text,
    timestamp: typeof time === "number" ? time : undefined,
    attributes: fields as AnyValueMap,
    // A escrita é síncrona dentro da chamada ao logger: o contexto ativo é o da
    // requisição, e o registro leva o trace_id e o span_id dela.
    context: context.active(),
  });
}

export function createOtelLogStream(): DestinationStream {
  return {
    write(chunk: string) {
      // Exportar log nunca pode derrubar a requisição.
      try {
        emit(chunk);
      } catch {
        // O stdout continua com a linha.
      }
    },
  };
}
