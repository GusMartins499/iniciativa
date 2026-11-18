# Guardrails (Layer 2)

Regras do projeto que endurecem os guardrails universais.

```
protected: []
forbidden:
  - editar migração já aplicada em drizzle/ (criar uma nova no lugar)
  - qualquer commit, push, merge ou alteração no repositório depois de 30/11/2026 (congelamento do HackBrasil)
  - drizzle-kit push contra o banco de produção
  - commitar .env* (exceto .env.example), porque o repositório é público
notes: repositório público; autodeclaração de autismo é dado sensível (LGPD): nunca em log, fixture ou repositório
secret_check_false_positives:
  - drizzle/meta/*_snapshot.json: o snapshot gerado pelo drizzle-kit repete o schema inteiro, e as tabelas do Better Auth têm colunas chamadas access_token, refresh_token, id_token, token e password. Esses nomes acionam o padrão do secret check sem ser segredo
```

O falso positivo vale só para esse arquivo e só quando os acertos são nomes de coluna
(`"name": "access_token"`, chaves de coluna, nomes de índice). Para confirmar, rode o check
de novo sem o snapshot (`git diff --cached -U0 -- . ':!drizzle/meta/*_snapshot.json'`) e confira
que, dentro dele, nenhum acerto traz valor. O resto do diff segue com o check completo. Se
aparecer um valor no snapshot, o check para como em qualquer outro arquivo.
