# iniciativa

Webapp para jovens autistas proporem encontros presenciais e confirmarem presença. É um MVP de um programa do SIGMA PARK, com piloto em Tubarão-SC.

- Documento de produto: [`docs/product/iniciativa-mvp.md`](docs/product/iniciativa-mvp.md)
- Regras de engenharia: [`GUIDELINES.md`](GUIDELINES.md)

## Stack

Next.js (App Router) + TypeScript, Postgres no Neon, Drizzle ORM, Tailwind CSS + shadcn/ui, pino e Vitest. O deploy é na Vercel.

## Pré-requisitos

- Node 22 ou mais novo.
- pnpm, na versão fixada em `packageManager` no `package.json`. Rode `corepack enable` para usá-la.

## Setup local

1. Instale as dependências:

   ```bash
   pnpm install
   ```

2. Crie o banco no Neon:
   1. No [painel do Neon](https://console.neon.tech), crie um projeto no plano gratuito.
   2. Crie uma branch para desenvolvimento, por exemplo `dev`, e use essa branch localmente. Nunca use a branch de produção.
   3. Copie a connection string **pooled** da branch.
3. Crie o login com Google no [Google Cloud Console](https://console.cloud.google.com):
   1. Crie um projeto e configure a **tela de consentimento OAuth** com o tipo de usuário **Externo**.
   2. Deixe o app em **modo de teste** e cadastre os e-mails do piloto em **Usuários de teste**. Só esses e-mails conseguem entrar, até 100 pessoas, o que combina com o público controlado do MVP.
   3. Em **Credenciais**, crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**, com estas URIs de redirecionamento autorizadas:
      - `http://localhost:3000/api/auth/callback/google`
      - `https://<seu-projeto>.vercel.app/api/auth/callback/google`
   4. Copie o ID e a chave secreta do cliente.
4. Crie o arquivo `.env.local` a partir do `.env.example` e preencha os valores:

   ```bash
   cp .env.example .env.local
   ```

5. Aplique as migrações no banco da branch de desenvolvimento:

   ```bash
   pnpm db:migrate
   ```

6. Suba o app:

   ```bash
   pnpm dev
   ```

O `.env.local` nunca é commitado. O repositório é público.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe o app em modo de desenvolvimento |
| `pnpm build` | Gera o build de produção |
| `pnpm lint` | Lint com Oxlint |
| `pnpm format` / `pnpm format:check` | Formata ou confere a formatação com Oxfmt |
| `pnpm typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `pnpm test` | Testes com Vitest |
| `pnpm db:generate` | Gera a migração SQL a partir do schema do Drizzle |
| `pnpm db:migrate` | Aplica as migrações no banco do `DATABASE_URL` |

Os testes de módulo usam um Postgres em memória (PGlite) e não precisam de banco configurado.

## Variáveis de ambiente

Todas estão listadas em [`.env.example`](.env.example). Na Vercel, cadastre-as em **Settings → Environment Variables**.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Connection string pooled do Neon |
| `BETTER_AUTH_SECRET` | Segredo da sessão. Gere com `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL pública do app (`http://localhost:3000` localmente; a URL de produção `*.vercel.app` na Vercel) |
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth do Google |
| `GOOGLE_CLIENT_SECRET` | Chave secreta do cliente OAuth do Google |

Na Vercel, `BETTER_AUTH_URL` precisa ser a URL de **produção**. Os deploys de preview têm outra URL, e o login com Google não funciona neles.
