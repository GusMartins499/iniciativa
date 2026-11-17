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

Configurados nos painéis do Grafana Cloud, sem IaC (GUIDELINES.md § Infra provisioning). Os
passos ficam no card #45. Os thresholds iniciais são chute: revisar com tráfego real.

| Alerta | Fonte | O que mede |
|---|---|---|
| Site fora do ar | Synthetic Monitoring | check HTTP da home de produção, de 2 regiões; dispara após 2 falhas seguidas |
| Falha inesperada | Loki | qualquer log `level="error"` do serviço `iniciativa` em 5 min |
| Taxa de erro HTTP | Tempo (TraceQL) | spans de rota com `status = error` acima de 5% em 15 min, com mínimo de requisições |
| Lentidão | Tempo (TraceQL) | p95 dos spans de Server Action (POST de página) acima de 2 s por 15 min |

Dashboard **iniciativa**: requisições por minuto, taxa de erro, p95 por rota e Server Action, e a
contagem dos eventos de negócio a partir do Loki. As consultas agregam por evento e rota, nunca
por `userId`.
