import { z } from "zod";

// Linha vazia do .env.example chega como "": vale como ausente.
const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

// Traces por OTLP (GUIDELINES.md § Tracing). Sem endpoint, a telemetria fica desligada.
const telemetryEnvSchema = z.object({
  OTEL_EXPORTER_OTLP_ENDPOINT: z.preprocess(emptyAsUndefined, z.url().optional()),
  // Segredo: leva o token do Grafana Cloud.
  OTEL_EXPORTER_OTLP_HEADERS: z.preprocess(emptyAsUndefined, z.string().optional()),
  OTEL_SERVICE_NAME: z.preprocess(emptyAsUndefined, z.string().default("iniciativa")),
});

// Única porta de leitura de variáveis de ambiente do app (GUIDELINES.md § Best practices).
const serverEnvSchema = telemetryEnvSchema.extend({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  // A Vercel manda nos crons como `Authorization: Bearer <CRON_SECRET>`.
  CRON_SECRET: z.string().min(16),
  // Só nos testes e2e: endereço do wsproxy do Neon na frente de um Postgres comum, sem protocolo.
  // A linha `DATABASE_WS_PROXY=` do .env.example chega como "": vale como ausente.
  // Só loopback: o ws-proxy.ts desliga o TLS, e a senha do banco não pode sair da máquina.
  DATABASE_WS_PROXY: z.preprocess(
    emptyAsUndefined,
    z
      .string()
      .regex(/^(localhost|127\.0\.0\.1):\d+\/\S*$/)
      .optional(),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type TelemetryEnv = z.infer<typeof telemetryEnvSchema>;

function parseOrThrow<T>(schema: z.ZodType<T>, source: Record<string, string | undefined>): T {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Só os nomes: o valor de uma variável pode ser segredo.
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${names.join(", ")}`);
  }
  return parsed.data;
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return parseOrThrow(serverEnvSchema, source);
}

// Só as variáveis de OTEL: o instrumentation.ts roda no boot, antes de qualquer outra validação.
export function parseTelemetryEnv(source: Record<string, string | undefined>): TelemetryEnv {
  return parseOrThrow(telemetryEnvSchema, source);
}

export function getTelemetryEnv(): TelemetryEnv {
  return parseTelemetryEnv(process.env);
}

let cached: ServerEnv | undefined;

// Validação sob demanda: o `next build` roda sem as variáveis de produção.
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

// A linha `LOG_LEVEL=` do .env.example chega como "": vale como ausente, senão o app
// nem sobe para quem copiou o arquivo.
const logLevelSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
);

export function parseLogLevel(value: string | undefined) {
  return logLevelSchema.parse(value);
}

export const logLevel = parseLogLevel(process.env.LOG_LEVEL);

// Só nos testes: branch "test" do Neon para o teste de concorrência (opcional).
export const testDatabaseUrl = z.url().optional().parse(process.env.TEST_DATABASE_URL);
