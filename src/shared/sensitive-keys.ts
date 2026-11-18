// PII e dado de saúde (autodeclaração) nunca podem sair do app: nem no log (GUIDELINES.md
// § Logging) nem nos atributos de span (GUIDELINES.md § Tracing).
export const SENSITIVE_KEYS = [
  "name",
  "email",
  "image",
  "token",
  "cookie",
  "password",
  "declaration",
  "consent",
  // Texto do comentário (módulo comments).
  "body",
  "content",
] as const;
