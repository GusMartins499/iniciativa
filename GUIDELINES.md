# Guidelines do iniciativa

> Precedence: module GUIDELINES.md > codebase GUIDELINES.md > defaults. Guidelines tighten the pipeline's guardrails, but can never loosen them.

Stack: Next.js (App Router) + TypeScript, Postgres no Neon, Drizzle ORM, Better Auth (login com Google), deploy na Vercel. Produto: `docs/product/iniciativa-mvp.md`.

## Code style

- Todo identificador em **inglês**: pastas, arquivos, variáveis, funções, tipos, tabelas, colunas e ids de DOM, **inclusive nos testes**. Só os **textos de tela** e as **descrições de teste** (`describe`/`it`) ficam em português (pt-BR).
- Nomes de arquivo e pasta em `kebab-case` (`confirm-rsvp.ts`, `meetup-card.tsx`). As exceções são os arquivos com nome fixo do Next (`page.tsx`, `layout.tsx`, `route.ts`, `[...all]`).
- TypeScript em `strict`. É proibido `any`, inclusive implícito. Para dado desconhecido, use `unknown` e valide com Zod.
- Não use `export default`, exceto onde o Next exige (`page`, `layout`, `route`, `not-found`, `error`). Todo o resto usa export nomeado.
- Lint com **Oxlint** e formatação com **Oxfmt**. Código que não passa nos dois não é commitado.
- Comentários explicam o **porquê**, nunca o quê. Não deixe código comentado.

## Architecture

Monolito modular:

```
src/
  app/            ← só rotas, telas e Server Actions finas (em português na URL)
  modules/
    meetups/      ← criar, editar, cancelar, listar; regras de vagas e prazos
    rsvps/        ← confirmar, cancelar, acompanhante (companion)
    users/        ← perfil, autodeclaração, consentimento, exclusão de conta
    communities/  ← as 9 comunidades fixas, entrar e sair, contagem de membros
    comments/     ← comentários dos encontros e o apagamento 30 dias depois do fim
  shared/         ← db (cliente Drizzle), auth (Better Auth), logger, utilitários
```

- Cada módulo expõe sua API pública **só** por `src/modules/<module>/index.ts`. Ninguém importa arquivo interno de outro módulo.
- Um módulo **nunca consulta nem escreve nas tabelas de outro**. Precisa de um dado de lá? Chame uma função do `index.ts` do outro módulo. Por exemplo, `rsvps` pede a `meetups` a capacidade e o horário de início.
- `src/app/**` importa apenas `src/modules/*/index.ts` e `src/shared/**`. Nunca importa Drizzle, schema ou queries diretamente.
- `src/shared/**` nunca importa de `src/modules/**`.
- Server Action é fina: autentica, valida a entrada com Zod, chama o caso de uso do módulo e devolve o `Result`. Regra de negócio fica no módulo.
- A operação que cruza módulos (excluir conta cancela encontros e presenças) é orquestrada pelo módulo dono do caso de uso, no caso `users`. Ela chama as funções públicas dos outros módulos dentro da **mesma transação**, que é passada como parâmetro.
- Componente de cliente (`"use client"`) **nunca** importa o `index.ts` de um módulo, porque isso leva código de servidor (banco, auth) para o bundle do navegador e quebra o build. Ele importa o `client.ts` do módulo, a entrada pública que só reexporta código sem dependência de servidor: textos (`copy`), schemas Zod e tipos. Dados chegam por props, passados pela página (server component).
- A checagem otimista de sessão (só verifica se existe o cookie) fica em `src/proxy.ts`, a convenção do Next 16 que substitui o `middleware.ts`. Ela nunca decide acesso: quem decide é sempre o `requireOnboardedUser()` no servidor.

## Best practices

**Sempre:**
- Valide toda entrada no servidor com Zod, mesmo que o formulário já tenha validado.
- Verifique a sessão **e** a autodeclaração com consentimento aceito em toda Server Action e em toda rota protegida. Sem isso, redirecione para o onboarding.
- Mantenha as regras de negócio só no servidor: vagas, acompanhante, prazo até o início, permissão do criador.
- Leia variáveis de ambiente **só** por `src/shared/env.ts` (`getServerEnv()`), que valida com Zod sob demanda. ❌ Não use `process.env` fora desse arquivo; as exceções são o `drizzle.config.ts`, o `vitest.config.ts` e o `playwright.config.ts`, que rodam fora do app (o `vitest.config.ts` lê do `.env.local` só a `TEST_DATABASE_URL`), e o `process.env.NEXT_RUNTIME` do `src/instrumentation.ts`, que o Next define. Variável nova entra no schema do `env.ts` e no `.env.example` (e no README só quando o repositório for privado; ver § Infra provisioning).
- Variável **obrigatória** nova no schema do `env.ts` (sem `.optional()` nem `.default()`) entra, no mesmo PR, também no `e2eEnv` do `playwright.config.ts` e nos objetos de env válidos de `src/shared/env.test.ts`, `src/shared/env.chaos.test.ts` e `src/shared/db/client.chaos.test.ts`, com um valor curto e legível (§ Security). Sem isso, o e2e não sobe e esses testes quebram, porque o `getServerEnv()` valida o schema inteiro. Avise no PR que a variável precisa existir na Vercel (Production e Preview) e no `.env.local` antes do merge: sem ela, o app não sobe.
- Grave datas em **UTC** no banco (`timestamp with time zone`). Exiba e interprete as datas no fuso `America/Sao_Paulo`.

**Nunca:**
- Confiar em dado vindo do cliente, como contagem de vagas, id do criador ou horário.
- Colocar lógica de negócio em componente React.
- Escrever SQL cru fora do Drizzle. O que o query builder não expressar vai em `sql\`\`` do Drizzle, parametrizado e dentro do módulo dono.

## Infra provisioning

- Não há IaC no MVP. Vercel, Neon e o OAuth do Google são configurados pelos painéis de cada serviço.
- Toda variável de ambiente usada no código aparece em `.env.example`, com nome e descrição e **sem valor**.
- Os passos de setup (criar o projeto no Neon, configurar o OAuth do Google, configurar as variáveis na Vercel) dependem da visibilidade do repositório:
  - **Enquanto o repositório for público:** ❌ nenhum passo de setup nem de configuração de infraestrutura vai para o `README.md` ou outro arquivo do repositório. Eles ficam só nos cards (issues). Uma variável nova entra apenas no `.env.example`.
  - **Se o repositório se tornar privado (a partir desse momento):** os passos de setup passam a ficar no `README.md`, e uma variável nova entra no `.env.example` e no README no mesmo PR.
- Use apenas planos gratuitos e o subdomínio da Vercel. Não adicione serviço pago nem domínio próprio.

## Logging

- O logger é o **pino**, com saída JSON em stdout, que a Vercel captura. A instância única fica em `src/shared/logger`.
- Com a telemetria ligada (§ Tracing), os logs também vão por OTLP para o Grafana Cloud (Loki), com `trace_id` e `span_id` da requisição. A ponte (`src/shared/observability/otel-log-stream.ts`) lê a linha **já serializada e redigida** pelo pino. ❌ Não troque por hook antes da serialização (`hooks.logMethod`, `@opentelemetry/instrumentation-pino`): a redação deixa de valer para o que é exportado.
- O `@vercel/otel` não faz o flush dos logs no fim da requisição; o span processor de `createLogFlushSpanProcessor()` faz. Não o remova do `src/instrumentation.ts`.
- Use os níveis assim: `info` para ação de negócio concluída, `warn` para regra violada ou entrada recusada, `error` para falha inesperada, sempre com o erro anexado.
- Falha inesperada capturada no limite (Server Action, rota, `delete-account`, `auth`) usa `reportError(error, { event, ...ids })` de `src/shared/observability`: loga com `error`, anexa o erro e marca o span ativo com a exceção e o status `ERROR`. A mensagem de erro do app nunca interpola email, nome ou outra PII: a stack vai para o log e para o trace.
- Logue só **IDs internos** (`userId`, `meetupId`, `rsvpId`) e códigos de erro.
- **Nunca** logue nome, email, foto, token, cookie, conteúdo da autodeclaração ou do consentimento, nem a lista de confirmados.

## Observability instrumentation

- Todo caso de uso de escrita, ao terminar com sucesso, emite um evento `info` com nome `<domínio>.<ação no passado>`:
  `meetup.created`, `meetup.updated`, `meetup.cancelled`, `rsvp.confirmed`, `rsvp.cancelled`, `user.onboarded` (com `consentVersion`), `user.signup_completed` (volta do Google em `/boas-vindas/concluir` com o aceite registrado, para conta nova ou já existente), `user.consent_renewed` (aceite de uma versão nova do termo, com `consentVersion`), `user.deleted`, `community.joined`, `community.left`, `comment.created` (com `commentId`), `comment.deleted` (com `commentId` e `by`: `self`, `organizer` ou `account_deletion`), `comment.purged` (com `count`, só quando o job diário apagou algo) e `comment.purge.completed` (fim do job, também com `count: 0`; alimenta o alerta "Apagamento de comentários não rodou"). Recusas logam `warn`: `comment.rejected` (com `code`) e `comment.rate_limited` (mais de 10 comentários por minuto).
- Payload do evento: `{ event, userId, meetupId?, rsvpId?, withCompanion?, communitySlug?, audience?, source?, consentVersion? }`. O `meetup.created` leva o `audience`: `open` ou o slug da comunidade. O `community.joined` vindo do passo de comunidades do onboarding (`/boas-vindas/comunidades`) leva `source: onboarding`; entrar pela página "Comunidades" não leva `source`. Os IDs vão no payload; PII nunca vai.
- Evento novo segue o mesmo padrão e é registrado nesta lista.
- Evento novo que precisar de alerta ou de painel entra também no dashboard **iniciativa** do Grafana Cloud (alertas e painéis em `docs/agents/observability.md`). Painel e consulta agregam por evento e rota, nunca por `userId`.

## Tracing

- O servidor exporta **traces** por OTLP (OpenTelemetry) direto para o Grafana Cloud. O `src/instrumentation.ts` registra o `@vercel/otel`, que instrumenta as rotas, as Server Actions e o `fetch` do Next.
- Sem `OTEL_EXPORTER_OTLP_ENDPOINT`, nada é registrado: dev local, testes, e2e e CI rodam sem telemetria.
- Todo span passa pelo filtro de `src/shared/observability` antes de sair: a query string sai de toda URL (nos atributos e no nome do span), e saem os atributos `enduser.*` e os que têm no nome uma das chaves sensíveis do log (`src/shared/sensitive-keys.ts`). Atributo de span segue a mesma regra de PII do log (§ Logging).
- ❌ Não use os processadores `"auto"` do `@vercel/otel`: com o endpoint no env, eles criam um segundo exporter, sem o filtro.

## Error handling

- Toda função pública de módulo que pode falhar por regra de negócio retorna um `Result`:

  ```ts
  type Result<T, C extends string> =
    | { ok: true; data: T }
    | { ok: false; error: { code: C } };
  ```

- Os códigos de erro esperado são constantes em `SCREAMING_SNAKE_CASE`, definidas por módulo: `MEETUP_FULL`, `MEETUP_STARTED`, `MEETUP_CANCELLED`, `NOT_MEETUP_CREATOR`, `CAPACITY_BELOW_OCCUPIED`, `CREATOR_CANNOT_LEAVE`, `NOT_COMMUNITY_MEMBER`, `AUDIENCE_LOCKED`, `ONBOARDING_REQUIRED`, `VALIDATION_FAILED`.
- Use exceção **só** para falha inesperada (banco fora do ar, bug). A Server Action captura no limite, loga com `error` e devolve uma mensagem genérica em português ("Algo deu errado. Tente de novo.").
- Nunca use `throw` para regra de negócio. Nunca mostre stack trace ou mensagem técnica na tela.
- Cada `code` tem um texto de tela literal e direto no `copy.ts` do módulo. Exemplo: `MEETUP_FULL` vira "Este encontro está lotado."

## Fail-safe vs fail-fast

- **Escritas falham alto e são atômicas.** Confirmar presença, cancelar presença, criar, editar ou cancelar encontro e excluir conta rodam numa **transação única**.
- A checagem de vagas é feita **no banco, dentro da transação**. Trave a linha do encontro (`SELECT ... FOR UPDATE`, `.for('update')` no Drizzle), some as vagas ocupadas (contando o acompanhante) e só então insira. O encontro nunca pode passar do limite de vagas.
- Transação interativa exige o driver `drizzle-orm/neon-serverless`, com `Pool`/WebSocket. O driver `neon-http` **não** serve para escrita transacional.
- Garanta 1 RSVP por usuário por encontro com uma restrição `UNIQUE (meetup_id, user_id)`. Confirmar de novo é idempotente: devolve o RSVP existente e não ocupa vaga extra.
- Não há retry automático em escrita.
- Leitura que falha mostra a mensagem de erro e um botão "Tentar de novo". Não fica tela em branco nem spinner infinito.

## Approved libraries & dependency policy

| Assunto | Use | Não use |
|---|---|---|
| UI / estilo | Tailwind CSS + shadcn/ui (Radix), com `clsx` + `tailwind-merge` + `class-variance-authority` (base do `cn` do shadcn) | bibliotecas de animação (framer-motion etc.) |
| Formulários | react-hook-form + Zod (`@hookform/resolvers`), com o schema Zod compartilhado entre cliente e servidor | estado manual com `useState` por campo |
| Validação | Zod | nenhuma |
| Datas | date-fns + date-fns-tz | moment, dayjs |
| Ícones | lucide-react | nenhuma |
| HTTP | `fetch` nativo | axios |
| Estado de ação assíncrona | `useActionState` / `useTransition` do React | `useState` manual para pending/erro; TanStack Query (sem cache de dados no cliente no MVP) |
| Banco | drizzle-orm + drizzle-kit + `@neondatabase/serverless` | outro ORM, SQL cru |
| Auth | better-auth (adapter Drizzle, provider Google) | next-auth |
| Logger | pino | nenhuma |
| Tracing | OpenTelemetry: `@vercel/otel` 2.3.0, com os peers `@opentelemetry/api` 1.9.1, `sdk-trace-base`, `resources` e `sdk-metrics` 2.12.1, `instrumentation`, `api-logs`, `sdk-logs` e `exporter-logs-otlp-http` 0.223.2 (versões exatas) | SDK de fornecedor (Sentry, Datadog etc.) |
| Scripts de dev | tsx (só para rodar `scripts/`, como o `pnpm db:seed`, fora do Next) | ts-node |
| Testes | Vitest, PGlite, Testing Library, vitest-axe, jsdom (ambiente dos testes de tela); Playwright (`@playwright/test`, só Chromium) nos testes e2e de `e2e/` | Cypress |

- O gerenciador de pacotes é só o **pnpm**, com a versão fixada no campo `packageManager` do `package.json`. Commite o `pnpm-lock.yaml`; nunca commite `package-lock.json` nem `yarn.lock`.
- Uma dependência nova só entra quando nenhuma da tabela resolve o problema, e precisa de aprovação explícita com nome e versão.
- Dependência aprovada entra nesta tabela no mesmo PR.

## Data & migrations

- Toda mudança de schema passa por `drizzle-kit generate`. As migrações SQL ficam versionadas em `drizzle/` e são revisadas no PR.
- Nunca use `drizzle-kit push` contra o banco de produção.
- Nunca edite uma migração que já foi aplicada. Para corrigir, crie uma migração nova.
- Comece sempre por mudanças aditivas. Renomear ou remover coluna é feito em passos separados: adicionar, migrar dados, depois remover.
- A migração vai **no mesmo PR** da feature que precisa dela.
- Desenvolvimento e testes usam uma branch do Neon ou PGlite, nunca o banco de produção.

## Security & sensitive data

- **PII neste domínio:** nome, email e foto vindos do Google; a **autodeclaração e o consentimento**, que são dado de saúde, ou seja, dado sensível pela LGPD; e a lista de confirmados de cada encontro.
- Segredos ficam só nas variáveis de ambiente da Vercel e no `.env.local`. Nunca commite arquivos `.env*` (exceto `.env.example`). **O repositório é público.**
- Seeds, fixtures e dados de teste são sempre **sintéticos**, nunca de pessoas reais.
- ❌ Nem sintético, um teste usa valor com cara de credencial: header `Authorization`, `Basic`/`Bearer` com base64, string longa aleatória. O GitGuardian acusa no PR, e o commit fica no histórico (sem force-push). Use um header qualquer (`X-Equipe=valor`) ou um valor curto e legível.
- A sessão é do Better Auth, com cookie `httpOnly`, `secure` e `sameSite=lax`. Não guarde token em `localStorage`.
- A autorização é verificada sempre no servidor:
  - só o criador edita ou cancela o encontro;
  - só o criador vê os primeiros nomes dos confirmados e quem leva acompanhante;
  - os demais usuários recebem do servidor apenas a ocupação (por exemplo, `7/10`), nunca a lista.
- Excluir a conta **apaga de fato** (hard delete) o perfil, a autodeclaração, o consentimento e as sessões. Não fica cópia nem backup de PII. Os encontros passados do usuário perdem a referência ao criador.

## Commit / branch / PR conventions

- Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição no imperativo`, **em português**. O escopo é o módulo (`meetups`, `rsvps`, `users`, `communities`, `shared`, `app`). Exemplo: `feat(rsvps): permite confirmar presença com acompanhante`.
- Branch: `tipo/<nº-da-issue>-slug`, por exemplo `feat/12-confirmar-presenca`. Cada card tem sua própria branch.
- O PR é escrito em português, com as seções **Contexto**, **O que mudou**, **Como testar** e `Closes #<n>`.
- **Congelamento do hackathon:** depois de **30/11/2026** não há commit, push, merge nem alteração alguma no repositório.

## Testing

- Use **Vitest**. Todo caso de uso de módulo tem teste das suas regras:
  - limite de vagas;
  - acompanhante ocupando vaga;
  - prazo até o início;
  - permissão do criador;
  - idempotência do RSVP;
  - exclusão de conta.
- Os testes de módulo rodam contra **Postgres de verdade** (PGlite em memória ou branch do Neon). Não use mock do banco.
- Telas: teste de componente com Testing Library e checagem com axe (`vitest-axe`) nos fluxos principais (onboarding, criar encontro, confirmar e cancelar presença).
- Fluxos de ponta a ponta: Playwright em `e2e/`, contra o build de produção e um Postgres descartável (`e2e/compose.yaml`), no job `e2e` do CI em todo PR. Local: `pnpm e2e:db && pnpm e2e`. A sessão entra pelo `storageState` gravado no `e2e/global-setup.ts`; o login com o Google não é exercido.
- Não há meta de cobertura. A regra de negócio sem teste é o que bloqueia o PR.

## Domain criticality

Os níveis abaixo são a referência de severidade do `/chaos-engineering`.

- **Crítico:**
  - vazar a autodeclaração ou qualquer PII (em tela, log, resposta de API ou repositório);
  - alguém que não é o criador ver os nomes dos confirmados;
  - entrar no app sem autodeclaração ou sem consentimento;
  - a exclusão de conta deixar dados para trás;
  - um encontro passar do limite de vagas;
  - alguém ver quem é membro de uma comunidade (só a contagem é pública);
  - quem não é membro ver, confirmar ou cancelar presença num encontro de comunidade (a regra única é o `canSeeMeetup` de `meetups`: aberto, membro, criador ou com presença confirmada).
- **Alto:** confirmar ou cancelar presença falhar; editar, confirmar ou cancelar depois do início do encontro.
- **Médio / baixo:** falhas de exibição, de texto ou de layout que não afetam dados nem acesso.

## Accessibility (frontend)

- Use os componentes shadcn/ui (Radix), que já trazem navegação por teclado e ARIA. Não crie um controle interativo do zero sem a semântica equivalente.
- O foco fica sempre visível. Contraste mínimo **WCAG 2.1 AA** com a paleta da marca (definida no documento de produto).
- Não use animação, som nem autoplay. Desligue as animações padrão dos componentes.
- Transição só de **cor** (texto, fundo, borda, sombra), curta (150 ms), já aplicada globalmente no `globals.css` e desligada com `prefers-reduced-motion`. Não anime movimento, opacidade nem tamanho.
- Toda ação que muda dados abre um diálogo de confirmação com **verbo literal**: "Cancelar minha presença", "Excluir minha conta", "Cancelar este encontro". Não use "OK" nem "Sim".
- A mensagem de erro aparece em texto claro, junto do campo ou da ação que falhou.
- Alvos de toque têm no mínimo **44×44 px**.
- A barra de navegação cabe sem rolagem horizontal de **375 px** até a largura do container, sem passar da borda do cabeçalho. Item novo na navegação vem com o e2e de largura (`e2e/communities.spec.ts`, em 375, 640 e 1280 px).
- Linguagem de tela literal e direta, sem ironia, metáfora ou gíria.
- A cor e o ícone de cada comunidade vêm só de `src/app/community-theme.ts` (pelo `CommunityIcon` e pelo `communityStyle`), nunca de cor solta no componente. Comunidade nova entra ali e no teste de contraste (AA, 4,5:1). A cor nunca carrega a informação sozinha: o nome escrito, ou o contexto da tela, diz qual é a comunidade. Tabela no documento de produto (§ Identidade visual).

## i18n & routes (frontend)

- O app existe só em pt-BR, sem biblioteca de i18n. Os textos de tela ficam centralizados em `copy.ts` por módulo (ou por rota, quando forem só da tela).
- As URLs ficam em português para o usuário: `/encontros`, `/encontros/novo`, `/encontros/[id]`, `/encontros/[id]/editar`, `/meus-encontros`, `/comunidades`, `/comunidades/[slug]`, `/boas-vindas` (onboarding), `/conta`.
- Datas e horários seguem o formato brasileiro (`dd/MM/yyyy`, `HH:mm`), no fuso `America/Sao_Paulo`.
