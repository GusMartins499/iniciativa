# Observability

Logs JSON nos logs da Vercel e, por OTLP, no Grafana Cloud (Loki), com `trace_id`. Traces por OTLP no Grafana Cloud (plano Free), sem PII
(filtro em `src/shared/observability`). Alertas e dashboard no Grafana Cloud (tabela abaixo). Convenções completas em `GUIDELINES.md` § Logging, § Observability instrumentation e § Tracing.

```
platform: grafana-cloud
exporter: otlp
logger: pino
logs: otlp
conventions: eventos "<domínio>.<ação no passado>" (meetup.created, rsvp.confirmed...) com IDs, nunca PII; traces automáticos do Next (rotas, Server Actions, fetch) sem PII
alerts: site fora do ar, falha inesperada, taxa de erro HTTP, lentidão (email do autor)
dashboard: iniciativa
```

Configurados nos painéis do Grafana Cloud, sem IaC (GUIDELINES.md § Infra provisioning), na pasta
`iniciativa`, com notificação por email (contact point `iniciativa-email`). Os passos ficam no
card #45. Os thresholds iniciais são chute: revisar com tráfego real. O Tempo não serve de fonte
de alerta; taxa de erro e latência vêm das métricas que o Grafana Cloud gera dos spans
(`traces_spanmetrics_*`, label `service="iniciativa"`).

| Alerta | Fonte | O que mede |
|---|---|---|
| Site fora do ar | Synthetic Monitoring (`probe_success`) | check HTTP `iniciativa-home` na home de produção a cada 5 min, de São Paulo e North Virginia; dispara quando a falha dura 5 min (2 checagens seguidas) |
| Falha inesperada | Loki | qualquer log do serviço `iniciativa` com `severity_number >= 17` (error ou fatal) em 5 min |
| Taxa de erro HTTP | métricas de span (`traces_spanmetrics_calls_total`) | spans de rota (`SPAN_KIND_SERVER`) com status de erro acima de 5% em 15 min, com no mínimo 20 requisições |
| Lentidão | métricas de span (`traces_spanmetrics_latency`) | p95 dos spans de Server Action (POST de página, fora `/api/*`) acima de 2 s por 15 min |

Dashboard **iniciativa**: requisições por minuto, taxa de erro, p95 por rota e Server Action, e a
contagem dos eventos de negócio a partir do Loki. As consultas agregam por evento e rota, nunca
por `userId`.
