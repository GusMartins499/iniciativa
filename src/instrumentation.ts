// Convenção do Next: roda uma vez no boot de cada instância do servidor.
// Sem OTEL_EXPORTER_OTLP_ENDPOINT, nada é registrado (GUIDELINES.md § Tracing).
export async function register() {
  // Exceção ao env.ts (GUIDELINES.md § Best practices): o Next define o runtime aqui.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getTelemetryEnv } = await import("./shared/env");
  const { createTraceExporter } = await import("./shared/observability");
  const env = getTelemetryEnv();
  const traceExporter = createTraceExporter(env);
  if (!traceExporter) return;

  const { registerOTel } = await import("@vercel/otel");
  registerOTel({
    serviceName: env.OTEL_SERVICE_NAME,
    traceExporter,
    // Sem os processadores "auto": com o endpoint no env, o @vercel/otel criaria um segundo
    // exporter OTLP, sem o filtro de PII.
    spanProcessors: [],
  });
}
