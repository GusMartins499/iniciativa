# iniciativa — MVP

Webapp para jovens autistas proporem encontros presenciais e confirmarem presença, parecido com um meetup feito só para esse público. O projeto faz parte de um programa do SIGMA PARK e também será inscrito no hackathon HackBrasil.

## Problem

O isolamento social é um tema comum e recorrente em diagnósticos e terapias de jovens autistas. A pesquisa feita pelo autor do projeto confirma isso. Faltam meios simples e seguros para esses jovens combinarem encontros presenciais entre si.

## Who it's for

- Jovens autistas **maiores de 18 anos**, com **nível de suporte 1** ou com autonomia para ir sozinhos a um encontro.
- O piloto acontece só em **Tubarão-SC**, com um **público controlado** de pessoas que o autor conhece pessoalmente.
- Quem vai junto como acompanhante não tem conta. Ele aparece apenas como "+1" na confirmação de presença de um usuário.

## Success criteria

- **Resultado do piloto:** pelo menos **3 encontros realizados**, cada um com **5 ou mais participantes**, em **8 semanas** de piloto. O app não registra comparecimento. Quem mede é o autor, de fora do app, colhendo o retorno de quem organizou cada encontro.
- **Entrega no hackathon:** até **30/11/2026**, a demo funciona de ponta a ponta. Isso significa entrar com Google, fazer a autodeclaração, cadastrar um encontro, confirmar presença e cancelar presença.

## Scope

### In

- **Login com Google.** No primeiro acesso a pessoa faz uma **autodeclaração**. Ela marca que é autista (nível 1 ou com autonomia) e maior de 18, e aceita um **termo de consentimento LGPD** para o uso desse dado de saúde. Quem não aceita não acessa o app.
- **Cadastro de encontro por qualquer usuário cadastrado**, sem aprovação prévia.
  - Campos obrigatórios: título, data, horário de início e de fim, endereço (texto livre) e número de vagas.
  - Campo opcional: descrição do local.
  - O criador declara que o local é **público**, como praça, café ou biblioteca.
  - O criador entra **confirmado automaticamente** e ocupa 1 vaga. Ele pode marcar que leva acompanhante.
- **Edição e cancelamento do encontro pelo criador**, até o horário de início.
  - As vagas não podem ficar abaixo do número já ocupado, contando os acompanhantes.
  - Quem confirmou passa a ver no app que o encontro foi "alterado" ou "cancelado".
- **Confirmar e cancelar presença** até o horário de início.
  - Cada pessoa pode levar **no máximo 1 acompanhante**, e o acompanhante **ocupa uma vaga**.
  - Quando não há vaga, a confirmação é bloqueada e o encontro aparece como **lotado**. Se alguém cancelar, a vaga volta a ficar livre para quem chegar primeiro. Não há lista de espera.
  - O criador não pode cancelar a própria presença. Para sair, ele precisa cancelar o encontro.
- **Privacidade da lista de confirmados.** Todo mundo vê só a ocupação, por exemplo "7 de 10 vagas". Apenas o criador vê os primeiros nomes de quem confirmou e se cada um leva acompanhante.
- **Navegação** com duas visões:
  - lista dos próximos encontros, em ordem de data (encontros que já passaram não aparecem);
  - "meus encontros", com os que eu criei e os que eu confirmei.
- **Exclusão da conta pelo próprio usuário.** Apaga o perfil e a autodeclaração e cancela as presenças futuras. Os encontros futuros que a pessoa criou são cancelados. Os encontros passados continuam, sem o nome do criador.
- **Acessibilidade pensada para o público autista** (detalhes em Constraints & dependencies).

### Out

- Chat entre usuários.
- Notificações por email ou push. Alterações e cancelamentos aparecem só dentro do app.
- Envio de laudo. A validação é só por autodeclaração.
- Mapa e geolocalização.
- Outras cidades além de Tubarão-SC.
- Perfil público com interesses.
- Avaliação ou denúncia de encontros.
- App nativo. O produto é só webapp.
- Painel ou papel de administrador. O autor usa o app como usuário comum. Se for preciso, corrige direto no banco de dados.
- Registro de comparecimento (check-in) no app.
- Lista de espera.
- Usuários menores de 18 anos.

## Acceptance criteria

- **Dado** um visitante sem conta, **quando** ele entra com Google pela primeira vez, **então** precisa marcar a autodeclaração e aceitar o termo LGPD antes de ver qualquer encontro.
- **Dado** um usuário que recusa ou não marca a autodeclaração, **quando** tenta seguir, **então** não acessa o app.
- **Dado** um usuário cadastrado, **quando** cadastra um encontro com título, data, horários, endereço e vagas e declara que o local é público, **então** o encontro aparece na lista de próximos e ele já consta como confirmado, ocupando 1 vaga.
- **Dado** um cadastro de encontro sem algum campo obrigatório, ou sem a declaração de local público, **quando** o usuário tenta salvar, **então** o cadastro é recusado e ele vê o que falta.
- **Dado** um encontro com vagas livres, **quando** um usuário confirma presença sem acompanhante, **então** a ocupação aumenta em 1.
- **Dado** um encontro com 2 ou mais vagas livres, **quando** um usuário confirma presença com acompanhante, **então** a ocupação aumenta em 2.
- **Dado** um encontro com só 1 vaga livre, **quando** um usuário tenta confirmar com acompanhante, **então** a confirmação é bloqueada. Confirmar sozinho continua possível.
- **Dado** um encontro lotado, **quando** outro usuário abre o encontro, **então** ele aparece como lotado e não dá para confirmar.
- **Dado** um usuário confirmado, **quando** cancela a presença antes do início, **então** as vagas dele (e do acompanhante, se houver) voltam a ficar livres.
- **Dado** um encontro que já começou, **quando** alguém tenta confirmar, cancelar presença ou editar, **então** a ação é bloqueada.
- **Dado** o criador de um encontro, **quando** tenta cancelar a própria presença, **então** o app não permite e indica que ele pode cancelar o encontro.
- **Dado** o criador editando um encontro com 6 vagas ocupadas, **quando** tenta reduzir para menos de 6 vagas, **então** a edição é recusada.
- **Dado** um encontro editado ou cancelado pelo criador, **quando** um confirmado abre "meus encontros", **então** vê o aviso de "alterado" ou "cancelado".
- **Dado** um usuário que não é o criador, **quando** abre um encontro, **então** vê só a ocupação, por exemplo "7 de 10 vagas", e nenhum nome.
- **Dado** o criador, **quando** abre o próprio encontro, **então** vê o primeiro nome de cada confirmado e se ele leva acompanhante.
- **Dado** um usuário que criou encontros futuros e confirmou presença em outros, **quando** exclui a conta, **então** os encontros dele são cancelados, as presenças dele são liberadas e o perfil e a autodeclaração são apagados.
- **Dado** qualquer ação que muda dados (confirmar, cancelar presença, cancelar encontro, excluir conta), **quando** o usuário aciona, **então** o app pede uma confirmação explícita antes de executar.

## Constraints & dependencies

- **Prazo do hackathon (HackBrasil, https://hackbrasil.com/).** A entrega final é em **30/11/2026**, com uma demo funcionando e um vídeo de no máximo 3 minutos. **Depois de 30/11/2026, nenhuma alteração nem commit no repositório.**
- **O repositório é público**, por exigência do hackathon. Nenhum dado real de usuário, segredo ou credencial pode ir para o repositório.
- **Orçamento zero.** Só ferramentas com plano gratuito e sem domínio próprio, usando o subdomínio que a hospedagem oferece.
- **LGPD.** A autodeclaração de autismo é **dado pessoal sensível** (saúde). Exige consentimento explícito e direito de exclusão, que já estão no escopo.
- **Dependência externa:** login com Google.
- **Programa SIGMA PARK.** O projeto faz parte do programa.
- **Acessibilidade:**
  - linguagem literal e direta;
  - sem animações e sem sons;
  - cores suaves;
  - toda ação com confirmação explícita;
  - **WCAG 2.1 AA** como base.
- **Identidade visual:**
  - Cores:

    | Uso | Cor |
    |---|---|
    | Fundo (neutro quente) | `#FAF7F2` |
    | Superfície | `#FFFFFF` |
    | Borda | `#E9E2D6`, reforçada `#D6CCBB` |
    | Texto | `#1C1917` |
    | Texto secundário | `#57534E` |
    | Primária (ardósia) | `#334155`, hover `#1E293B` |
    | Etiqueta | fundo `#F0EBE3`, texto `#44403C` |
    | Mel | `#F59E0B`, hover `#D97706` |
    | Mel claro | fundo `#FEF3C7`, texto `#92400E` |

  - Fonte: Inter em todo o app. O nome "iniciativa" vai em Inter Bold, em minúsculas, com espaçamento entre letras levemente fechado.
  - Logo: hexágono sólido em ardósia, com a face em mel.

### Riskiest assumptions

São três premissas, e qualquer uma delas, se falhar, derruba o MVP:

1. **Adesão:** o público controlado se cadastra e usa um webapp para isso.
2. **Iniciativa:** os jovens propõem encontros, e não apenas confirmam presença nos dos outros.
3. **Comparecimento:** quem confirma presença vai de fato ao encontro.

## Open questions

| Question | Owner | Status |
|---|---|---|
| O programa SIGMA PARK tem exigências próprias de entrega, prazo ou relatório além das do hackathon? | Autor do projeto (Gustavo) | Aberta |
| Qual o texto do termo de consentimento LGPD e da política de privacidade, e quem responde como controlador dos dados? | Autor do projeto (Gustavo) | Resolvida: o controlador é o autor, como pessoa física. O termo v1.0 fica em `/boas-vindas` (resumo) e em `/privacidade` (texto completo). Quem aceitou outra versão aceita de novo antes de usar o app. |
| Como o autor vai colher o retorno dos organizadores no piloto (formulário, conversa)? | Autor do projeto (Gustavo) | Aberta |
| Qual a data de início do piloto de 8 semanas? | Autor do projeto (Gustavo) | Aberta |
