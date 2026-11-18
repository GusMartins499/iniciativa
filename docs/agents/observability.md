# Observability

Logs JSON nos logs da Vercel e, por OTLP, no Grafana Cloud (Loki), com `trace_id`. Traces por OTLP no Grafana Cloud (plano Free), sem PII
(filtro em `src/shared/observability`). Alertas e dashboard no Grafana Cloud (tabela abaixo). Convenções completas em `GUIDELINES.md` § Logging, § Observability instrumentation e § Tracing.

```
platform: grafana-cloud
exporter: otlp
logger: pino
logs: otlp
conventions: eventos "<domínio>.<ação no passado>" (meetup.created, rsvp.confirmed...) com IDs, nunca PII; traces automáticos do Next (rotas, Server Actions, fetch) sem PII
alerts: site fora do ar, falha inesperada, taxa de erro HTTP, lentidão, apagamento de comentários não rodou (email do autor)
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

| Apagamento de comentários não rodou | Loki | nenhum `comment.purge.completed` do serviço `iniciativa` em 26 h (o job é diário; o termo v2 promete apagar comentários 30 dias depois do fim do encontro). Estado **No data = Alerting**: ausência de log chega como "sem dados", não como 0 |

Dashboard **iniciativa**: requisições por minuto, taxa de erro, p95 por rota e Server Action, e a
contagem dos eventos de negócio a partir do Loki. As consultas agregam por evento e rota, nunca
por `userId`. Painéis das comunidades: comentários por dia, entradas por comunidade (`communitySlug`), separando as do onboarding pelo `source`
e encontros criados por público (`audience`), agregados por comunidade, nunca por usuário.
Painel de aceites do termo por versão: `user.onboarded` e `user.consent_renewed` agrupados por
`consentVersion`, para acompanhar o reaceite da v2.

## Comunidades e comentários

Eventos (só IDs e slugs, nunca PII):

| Evento | Atributos |
|---|---|
| `community.joined`, `community.left` | `userId`, `communitySlug`; o `community.joined` do passo de comunidades do onboarding leva também `source: onboarding` |
| `meetup.created` | ganha `audience`: `open` ou o slug da comunidade |
| `comment.created` | `commentId`, `meetupId`, `userId` |
| `comment.deleted` | `commentId`, `meetupId`, `by`: `self` (o autor apagou o próprio), `organizer` (o criador do encontro apagou o de outra pessoa) ou `account_deletion` |
| `comment.purged` / `comment.purge.completed` | `count` (comentários apagados pelo job de 30 dias) |

O critério secundário do piloto (encontros com 3 ou mais comentários de 2 ou mais pessoas) não sai
do Loki: o plano Free guarda poucos dias e a conta exigiria agregar por `userId`. Sai da tabela
`meetup_comment_stats` (contagens por encontro, sem `userId`), consultada no fim do piloto.

O texto do comentário nunca vai para log nem para span: as chaves `body` e `content` entram em
`src/shared/sensitive-keys.ts`. Cada card dessas fatias traz, no critério de aceite, os eventos e
spans que emite.
