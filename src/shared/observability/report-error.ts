import { SpanStatusCode, trace } from "@opentelemetry/api";
import type { Logger } from "pino";
import { logger as defaultLogger } from "../logger";

type ErrorContext = { event: string } & Record<string, unknown>;

// Falha inesperada no limite (GUIDELINES.md § Error handling): loga com `error` e marca
// o span da requisição, para o trace aparecer como erro no Grafana.
export function reportError(
  error: unknown,
  errorContext: ErrorContext,
  logger: Logger = defaultLogger,
): void {
  logger.error({ ...errorContext, err: error });

  const span = trace.getActiveSpan();
  if (!span) return;
  span.recordException(error instanceof Error ? error : String(error));
  span.setStatus({ code: SpanStatusCode.ERROR });
}
