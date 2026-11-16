import pino, { type DestinationStream, type Logger } from "pino";

// PII e dado de saúde (autodeclaração) nunca podem chegar ao log — GUIDELINES.md § Logging.
const SENSITIVE_KEYS = [
  "name",
  "email",
  "image",
  "token",
  "cookie",
  "password",
  "declaration",
  "consent",
] as const;

const REDACT_PATHS = SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]);

export function createLogger(destination?: DestinationStream): Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
      redact: { paths: REDACT_PATHS, remove: true },
      base: undefined,
    },
    destination,
  );
}

export const logger = createLogger();
