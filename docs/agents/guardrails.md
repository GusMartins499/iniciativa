# Guardrails (Layer 2)

Regras do projeto que endurecem os guardrails universais.

```
protected: []
forbidden:
  - editar migração já aplicada em drizzle/ (criar uma nova no lugar)
  - qualquer commit, push, merge ou alteração no repositório depois de 30/11/2026 (congelamento do HackBrasil)
  - drizzle-kit push contra o banco de produção
  - commitar .env* (exceto .env.example) — repositório público
notes: repositório público; autodeclaração de autismo é dado sensível (LGPD) — nunca em log, fixture ou repositório
```
