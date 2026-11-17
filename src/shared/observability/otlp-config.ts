// Formato da spec do OTel: "chave=valor,chave2=valor2", com o valor codificado em URL.
export function parseOtlpHeaders(raw: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const pair of (raw ?? "").split(",")) {
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const key = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (!key) continue;
    try {
      headers[key] = decodeURIComponent(value);
    } catch {
      headers[key] = value;
    }
  }
  return headers;
}

// O endpoint é a base do OTLP; o caminho de cada sinal vem depois dele.
export function otlpSignalUrl(endpoint: string, signal: "traces" | "logs"): string {
  return `${endpoint.replace(/\/+$/, "")}/v1/${signal}`;
}
