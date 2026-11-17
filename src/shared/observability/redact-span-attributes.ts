import type { Attributes } from "@opentelemetry/api";
import { SENSITIVE_KEYS } from "../sensitive-keys";

// A query string pode levar PII ou segredo (o callback do OAuth do Google traz `code` e `state`).
const QUERY_KEYS = new Set(["url.query"]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.startsWith("enduser.") || SENSITIVE_KEYS.some((word) => lower.includes(word));
}

// Corta a partir do "?" (ou do "#") de uma URL absoluta ou de um caminho.
function stripQuery(value: string): string {
  if (!value.includes("://") && !value.startsWith("/")) return value;
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
}

// Devolve uma cópia dos atributos sem PII: o original não é alterado.
export function redactSpanAttributes(attributes: Attributes): Attributes {
  const redacted: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (QUERY_KEYS.has(key) || isSensitiveKey(key)) continue;
    redacted[key] = typeof value === "string" ? stripQuery(value) : value;
  }
  return redacted;
}

// O span de fetch leva a URL completa no nome ("fetch GET https://...?code=...").
export function redactSpanName(name: string): string {
  return name.split(" ").map(stripQuery).join(" ");
}
