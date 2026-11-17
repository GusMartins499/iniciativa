import pino, { type DestinationStream, type Logger } from "pino";
import { logLevel } from "./env";
import { SENSITIVE_KEYS } from "./sensitive-keys";

const REDACT_PATHS = SENSITIVE_KEYS.flatMap((key) => [key, `*.${key}`]);

export function createLogger(destination?: DestinationStream, level: string = logLevel): Logger {
  return pino(
    {
      level,
      redact: { paths: REDACT_PATHS, remove: true },
      base: undefined,
    },
    destination,
  );
}

export const logger = createLogger();
