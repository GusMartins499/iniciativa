# Guidelines — iniciativa

> Precedence: module GUIDELINES.md > codebase GUIDELINES.md > defaults. Guidelines tighten the pipeline's guardrails — they can never loosen them.

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
- Leia variáveis de ambiente **só** por `src/shared/env.ts` (`getServerEnv()`), que valida com Zod sob demanda. ❌ Não use `process.env` fora desse arquivo; as exceções são o `drizzle.config.ts` e o `vitest.config.ts`, que rodam fora do app (o `vitest.config.ts` lê do `.env.local` só a `TEST_DATABASE_URL`). Variável nova entra no schema do `env.ts`, no `.env.example` e no README.
- Grave datas em **UTC** no banco (`timestamp with time zone`). Exiba e interprete as datas no fuso `America/Sao_Paulo`.

**Nunca:**
- Confiar em dado vindo do cliente, como contagem de vagas, id do criador ou horário.
- Colocar lógica de negócio em componente React.
- Escrever SQL cru fora do Drizzle. O que o query builder não expressar vai em `sql\`\`` do Drizzle, parametrizado e dentro do módulo dono.

## Infra provisioning

- Não há IaC no MVP. Vercel, Neon e o OAuth do Google são configurados pelos painéis de cada serviço.
- Toda variável de ambiente usada no código aparece em `.env.example`, com nome e descrição e **sem valor**.
- Os passos de setup (criar o projeto no Neon, configurar o OAuth do Google, configurar as variáveis na Vercel) ficam no `README.md`. Uma variável nova entra no `.env.example` e no README no mesmo PR.
- Use apenas planos gratuitos e o subdomínio da Vercel. Não adicione serviço pago nem domínio próprio.

## Logging

- O logger é o **pino**, com saída JSON em stdout, que a Vercel captura. A instância única fica em `src/shared/logger`.
- Use os níveis assim: `info` para ação de negócio concluída, `warn` para regra violada ou entrada recusada, `error` para falha inesperada, sempre com o erro anexado.
- Logue só **IDs internos** (`userId`, `meetupId`, `rsvpId`) e códigos de erro.
- **Nunca** logue nome, email, foto, token, cookie, conteúdo da autodeclaração ou do consentimento, nem a lista de confirmados.

## Observability instrumentation

- Todo caso de uso de escrita, ao terminar com sucesso, emite um evento `info` com nome `<domínio>.<ação no passado>`:
  `meetup.created`, `meetup.updated`, `meetup.cancelled`, `rsvp.confirmed`, `rsvp.cancelled`, `user.onboarded`, `user.deleted`.
- Payload do evento: `{ event, userId, meetupId?, rsvpId?, withCompanion? }`. Os IDs vão no payload; PII nunca vai.
- Evento novo segue o mesmo padrão e é registrado nesta lista.

## Error handling

- Toda função pública de módulo que pode falhar por regra de negócio retorna um `Result`:

  ```ts
  type Result<T, C extends string> =
    | { ok: true; data: T }
    | { ok: false; error: { code: C } };
  ```

- Os códigos de erro esperado são constantes em `SCREAMING_SNAKE_CASE`, definidas por módulo: `MEETUP_FULL`, `MEETUP_STARTED`, `MEETUP_CANCELLED`, `NOT_MEETUP_CREATOR`, `CAPACITY_BELOW_OCCUPIED`, `CREATOR_CANNOT_LEAVE`, `ONBOARDING_REQUIRED`, `VALIDATION_FAILED`.
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
| Validação | Zod | — |
| Datas | date-fns + date-fns-tz | moment, dayjs |
| Ícones | lucide-react | — |
| HTTP | `fetch` nativo | axios |
| Estado de ação assíncrona | `useActionState` / `useTransition` do React | `useState` manual para pending/erro; TanStack Query (sem cache de dados no cliente no MVP) |
| Banco | drizzle-orm + drizzle-kit + `@neondatabase/serverless` | outro ORM, SQL cru |
| Auth | better-auth (adapter Drizzle, provider Google) | next-auth |
| Logger | pino | — |
| Testes | Vitest, PGlite, Testing Library, vitest-axe, jsdom (ambiente dos testes de tela) | — |

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
- A sessão é do Better Auth, com cookie `httpOnly`, `secure` e `sameSite=lax`. Não guarde token em `localStorage`.
- A autorização é verificada sempre no servidor:
  - só o criador edita ou cancela o encontro;
  - só o criador vê os primeiros nomes dos confirmados e quem leva acompanhante;
  - os demais usuários recebem do servidor apenas a ocupação (por exemplo, `7/10`), nunca a lista.
- Excluir a conta **apaga de fato** (hard delete) o perfil, a autodeclaração, o consentimento e as sessões. Não fica cópia nem backup de PII. Os encontros passados do usuário perdem a referência ao criador.

## Commit / branch / PR conventions

- Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/): `tipo(escopo): descrição no imperativo`, **em português**. O escopo é o módulo (`meetups`, `rsvps`, `users`, `shared`, `app`). Exemplo: `feat(rsvps): permite confirmar presença com acompanhante`.
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
- Não há meta de cobertura. A regra de negócio sem teste é o que bloqueia o PR.

## Domain criticality

Os níveis abaixo são a referência de severidade do `/chaos-engineering`.

- **Crítico:**
  - vazar a autodeclaração ou qualquer PII (em tela, log, resposta de API ou repositório);
  - alguém que não é o criador ver os nomes dos confirmados;
  - entrar no app sem autodeclaração ou sem consentimento;
  - a exclusão de conta deixar dados para trás;
  - um encontro passar do limite de vagas.
- **Alto:** confirmar ou cancelar presença falhar; editar, confirmar ou cancelar depois do início do encontro.
- **Médio / baixo:** falhas de exibição, de texto ou de layout que não afetam dados nem acesso.

## Accessibility (frontend)

- Use os componentes shadcn/ui (Radix), que já trazem navegação por teclado e ARIA. Não crie um controle interativo do zero sem a semântica equivalente.
- O foco fica sempre visível. Contraste mínimo **WCAG 2.1 AA** com a paleta da marca (definida no documento de produto).
- Não use animação, transição, som nem autoplay. Desligue as animações padrão dos componentes.
- Toda ação que muda dados abre um diálogo de confirmação com **verbo literal**: "Cancelar minha presença", "Excluir minha conta", "Cancelar este encontro". Não use "OK" nem "Sim".
- A mensagem de erro aparece em texto claro, junto do campo ou da ação que falhou.
- Alvos de toque têm no mínimo **44×44 px**.
- Linguagem de tela literal e direta, sem ironia, metáfora ou gíria.

## i18n & routes (frontend)

- O app existe só em pt-BR, sem biblioteca de i18n. Os textos de tela ficam centralizados em `copy.ts` por módulo (ou por rota, quando forem só da tela).
- As URLs ficam em português para o usuário: `/encontros`, `/encontros/novo`, `/encontros/[id]`, `/encontros/[id]/editar`, `/meus-encontros`, `/boas-vindas` (onboarding), `/conta`.
- Datas e horários seguem o formato brasileiro (`dd/MM/yyyy`, `HH:mm`), no fuso `America/Sao_Paulo`.
