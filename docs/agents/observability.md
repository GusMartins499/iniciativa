# Observability

Logs JSON nos logs da Vercel. Traces por OTLP no Grafana Cloud (plano Free), sem PII
(filtro em `src/shared/observability`). Convenções completas em `GUIDELINES.md` § Logging, § Observability instrumentation e § Tracing.

```
platform: grafana-cloud
exporter: otlp
logger: pino
conventions: eventos "<domínio>.<ação no passado>" (meetup.created, rsvp.confirmed...) com IDs, nunca PII; traces automáticos do Next (rotas, Server Actions, fetch) sem PII; sem dashboards, sem alertas
```
