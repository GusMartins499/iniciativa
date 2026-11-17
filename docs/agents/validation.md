# Validation

Comandos que `do-task` e `chaos-engineering` executam. Ferramentas definidas em
`GUIDELINES.md` (Oxlint, Oxfmt, TypeScript strict, Vitest). O projeto ainda não tem
`package.json`: o card de setup cria estes scripts. Até lá, todo handoff declara
"no validation configured".

```
lint: pnpm lint                # oxlint
format: pnpm format:check      # oxfmt --check
typecheck: pnpm typecheck      # tsc --noEmit
test: pnpm test                # vitest run
e2e: pnpm e2e:db && pnpm e2e    # playwright (sobe o Postgres do e2e/compose.yaml antes)
pr_size_budget: 500            # max changed production lines per PR (tests/fixtures/generated excluded)
guidelines:
  - AGENTS.md
  - GUIDELINES.md
```
