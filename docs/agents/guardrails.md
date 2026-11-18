# Guardrails (Layer 2)

Regras do projeto que endurecem os guardrails universais.

```
protected: []
forbidden:
  - editar migração já aplicada em drizzle/ (criar uma nova no lugar)
  - qualquer commit, push, merge ou alteração no repositório depois de 30/11/2026 (congelamento do HackBrasil)
  - drizzle-kit push contra o banco de produção
  - commitar .env* (exceto .env.example), porque o repositório é público
  - trocar de branch ou rodar `pnpm format` no repositório inteiro em /home/gusmartins/www/iniciativa quando outra sessão estiver trabalhando nessa pasta (usar uma git worktree própria)
notes: repositório público; autodeclaração de autismo é dado sensível (LGPD): nunca em log, fixture ou repositório
secret_check_false_positives:
  - drizzle/meta/*_snapshot.json: o snapshot gerado pelo drizzle-kit repete o schema inteiro, e as tabelas do Better Auth têm colunas chamadas access_token, refresh_token, id_token, token e password. Esses nomes acionam o padrão do secret check sem ser segredo
```

O falso positivo vale só para esse arquivo e só quando os acertos são nomes de coluna
(`"name": "access_token"`, chaves de coluna, nomes de índice). Para confirmar, rode o check
de novo sem o snapshot (`git diff --cached -U0 -- . ':!drizzle/meta/*_snapshot.json'`) e confira
que, dentro dele, nenhum acerto traz valor. O resto do diff segue com o check completo. Se
aparecer um valor no snapshot, o check para como em qualquer outro arquivo.

## Uma worktree por sessão

Várias sessões do ship-it rodam ao mesmo tempo neste repositório, e todas abrem na mesma pasta.
Um `git switch` ali muda a branch da outra sessão por baixo dela, e os commits dela caem na branch
errada. Isso já aconteceu em 18/11/2026, com os cards #57 e #68.

No pickup, se o `git status` mostrar arquivos que a sessão não tocou, ou se houver outra sessão
ocupada no repositório, crie a branch do card numa worktree própria:

```
git worktree add ../iniciativa-<n> -b <branch> origin/main
cd ../iniciativa-<n> && pnpm install --frozen-lockfile
```

Instale as dependências na worktree: um symlink para o `node_modules` da pasta principal quebra o
Turbopack (o e2e não sobe). Formate só os arquivos do próprio card, nunca a pasta compartilhada.

