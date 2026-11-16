# Observability

Sem plataforma de observabilidade (plano gratuito): os logs JSON vão para os logs da
Vercel. Convenções completas em `GUIDELINES.md` § Logging e § Observability instrumentation.

```
platform: none
logger: pino
conventions: eventos "<domínio>.<ação no passado>" (meetup.created, rsvp.confirmed...) com IDs, nunca PII; sem dashboards, sem alertas, sem métricas de latência
```
