import { z } from "zod";

// Única porta de leitura de variáveis de ambiente do app (GUIDELINES.md § Best practices).
const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    // Só os nomes: o valor de uma variável pode ser segredo.
    const names = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${names.join(", ")}`);
  }
  return parsed.data;
}

let cached: ServerEnv | undefined;

// Validação sob demanda: o `next build` roda sem as variáveis de produção.
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

const logLevelSchema = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info");

export const logLevel = logLevelSchema.parse(process.env.LOG_LEVEL);
