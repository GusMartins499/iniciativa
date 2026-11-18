import { trace } from "@opentelemetry/api";

// Atributo de produto no span da requisição (ex.: qual filtro a tela usou). Segue a regra de
// PII do log: só códigos e slugs, nunca userId nem dado pessoal. Sem telemetria, não faz nada.
export function annotateActiveSpan(attributes: Record<string, string>): void {
  trace.getActiveSpan()?.setAttributes(attributes);
}
