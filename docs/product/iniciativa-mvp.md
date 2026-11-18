# iniciativa: MVP

Webapp para jovens autistas proporem encontros presenciais e confirmarem presença, parecido com um meetup feito só para esse público. Os encontros acontecem dentro de **comunidades** de interesse em comum (RPG, cinema, corrida...) ou abertos a todos, e os detalhes são combinados nos **comentários** do próprio encontro, para que a conversa não saia do app. O projeto faz parte de um programa do SIGMA PARK e também será inscrito no hackathon HackBrasil.

## Problem

O isolamento social é um tema comum e recorrente em diagnósticos e terapias de jovens autistas. A pesquisa feita pelo autor do projeto confirma isso. Faltam meios simples e seguros para esses jovens combinarem encontros presenciais entre si.

## Who it's for

- Jovens autistas **maiores de 18 anos**, com **nível de suporte 1** ou com autonomia para ir sozinhos a um encontro.
- O piloto acontece só em **Tubarão-SC**, com um **público controlado** de pessoas que o autor conhece pessoalmente.
- Quem vai junto como acompanhante não tem conta. Ele aparece apenas como "+1" na confirmação de presença de um usuário.

## Success criteria

- **Resultado do piloto:** pelo menos **3 encontros realizados**, cada um com **5 ou mais participantes**, em **8 semanas** de piloto. O app não registra comparecimento. Quem mede é o autor, de fora do app, colhendo o retorno de quem organizou cada encontro.
- **Resultado secundário do piloto:** pelo menos **metade dos encontros realizados** teve **3 ou mais comentários de 2 ou mais pessoas diferentes**. É medido no fim do piloto por contagens anônimas por encontro (nº de comentários e de autores distintos), que sobrevivem ao apagamento de 30 dias e não guardam quem comentou.
- **Entrega no hackathon:** até **30/11/2026**, a demo funciona de ponta a ponta. Isso significa entrar com Google, fazer a autodeclaração, escolher comunidades, cadastrar um encontro para uma comunidade, comentar nele, confirmar presença e cancelar presença.

## Scope

### In

- **Login com Google.** No primeiro acesso a pessoa faz uma **autodeclaração**. Ela marca que é autista (nível 1 ou com autonomia) e maior de 18, e aceita um **termo de consentimento LGPD** para o uso desse dado de saúde. Quem não aceita não acessa o app.
  - Depois do termo vem um passo **opcional** "Escolha suas comunidades", com as 9 marcáveis. Dá para marcar nenhuma e seguir.
  - Quem já tinha conta antes das comunidades não refaz o onboarding: vê uma faixa no topo de "Próximos" ("Você ainda não está em nenhuma comunidade. Ver comunidades") enquanto não estiver em nenhuma.
- **Comunidades fixas**, já existentes no app: **ar livre, academia, RPG, card games, cinema, música, clube do livro, corrida e caminhada**. Usuários não criam comunidades.
  - Um usuário participa de **N comunidades**. Entrar e sair é livre, sem aprovação, e pede confirmação explícita.
  - Quem sai de uma comunidade **continua vendo e participando** dos encontros dela em que já confirmou (em "meus encontros"), mas deixa de ver os novos.
  - Ninguém vê a lista de membros. Cada comunidade mostra só o **número de membros** e o **número de encontros futuros**.
  - Página **"Comunidades"**: as 9 em lista, com nome, uma frase literal de descrição, nº de membros, nº de encontros futuros e o botão Entrar/Sair. Para quem é membro, cada card tem também um link visível **"Ver encontros"**, que leva à página da comunidade.
  - A etiqueta de comunidade nos cards de encontro ("RPG") leva à página da comunidade, para quem é membro.
  - **Página de cada comunidade** (por exemplo `/comunidades/rpg`): descrição, Entrar/Sair e, só para membros, os próximos encontros dela.
- **Cadastro de encontro por qualquer usuário cadastrado**, sem aprovação prévia.
  - Campos obrigatórios: título, data, horário de início e de fim, endereço (texto livre), número de vagas e **público**.
  - **Público:** "Aberto (todos)" **ou uma** comunidade da qual o criador é membro. Sem opção pré-marcada. O público **não muda** depois de criado: para trocar, cancela e cria de novo.
  - Encontro **aberto** aparece para todos os usuários. Encontro **de comunidade** aparece só para os membros dela.
  - Os encontros que já existiam antes das comunidades passam a ser abertos.
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
- **Privacidade da lista de confirmados.** Todo mundo vê só a ocupação, por exemplo "7 de 10 vagas". Apenas o criador vê o **primeiro nome e a foto** de quem confirmou e se cada um leva acompanhante. Sem foto, aparece a inicial.
- **Comentários no encontro**, para combinar os detalhes (horário, filme, ponto de encontro) sem sair do app.
  - **Quem vê o encontro lê e comenta**, confirmado ou não.
  - Cada comentário mostra o **primeiro nome e a foto** do autor (a foto do Google, ou a inicial), **sem indicar se ele confirmou presença**. O criador do encontro aparece com o selo **"organizador"**.
  - O campo de comentário avisa que o primeiro nome e a foto aparecem para quem vê o encontro, e que não se deve escrever dados pessoais ou de saúde (telefone, endereço, diagnóstico).
  - Só texto, até **500 caracteres**, sem links clicáveis, sem imagens, sem reações. Sem edição.
  - Ficam no fim da página do encontro, do mais antigo para o mais novo, com o campo de escrever no final. Sem tempo real: a lista atualiza ao enviar ou recarregar.
  - **Moderação:** o autor apaga o próprio comentário, e o criador do encontro apaga qualquer comentário do encontro dele. No lugar fica "Comentário apagado", e o texto é removido do banco.
  - Os comentários **fecham no horário de fim** do encontro. Num encontro cancelado, ficam só para leitura.
  - **Retenção:** um job diário apaga os comentários **30 dias depois do fim** do encontro.
- **Navegação** com três visões:
  - "Próximos": os encontros abertos mais os das minhas comunidades, em ordem de data (encontros que já passaram não aparecem). Cada card tem uma etiqueta com o público ("RPG" ou "Aberto");
    - **Filtro por público:** "Todos" (padrão), "Abertos" ou uma das comunidades de que sou membro. Só aparecem as minhas comunidades, nunca as outras. A escolha fica na URL, para que voltar e recarregar mostrem o mesmo filtro. Com o filtro sem resultado, a tela diz isso de forma literal e oferece voltar para "Todos";
  - "meus encontros", com os que eu criei e os que eu confirmei;
  - "Comunidades".
- **Exclusão da conta pelo próprio usuário.** Apaga o perfil, a autodeclaração e a participação nas comunidades e cancela as presenças futuras. Os comentários da pessoa viram "Comentário apagado". Os encontros futuros que a pessoa criou são cancelados. Os encontros passados continuam, sem o nome do criador.
- **Termo de consentimento v2**, com reaceite por quem aceitou a v1.0. Cobre a exibição do nome e da foto (em comentários e para o criador), a participação em comunidades, o conteúdo dos comentários e a retenção de 30 dias.
- **Landing page:**
  - título mantido: "Promovemos encontros face a face para jovens autistas";
  - lead: "Entre nas suas comunidades, proponha um encontro e divirta-se.";
  - "Como funciona" com 5 a 6 passos (incluindo escolher comunidades e combinar nos comentários), numa **grade de cards com o número dentro de um hexágono** no estilo do logo, estática, com "Tome INICIATIVA" em destaque. O design é escolhido num protótipo antes;
  - seção com as 9 comunidades;
  - FAQ reescrito: quem vê o meu nome e a minha foto, o que acontece quando um encontro muda (sem notificações, mas com comentários), e "Posso criar uma comunidade nova?" ("Ainda não. Por enquanto existem só estas 9.").
- **Acessibilidade pensada para o público autista** (detalhes em Constraints & dependencies).
- **Mais personalidade nas telas do app**, a partir do d20 do logo e do tema de jogos e encontros. A direção visual é escolhida num protótipo antes e respeita as regras de acessibilidade (sem animações, cores suaves, WCAG 2.1 AA).

### Out

- Chat em tempo real, chat da comunidade fora dos encontros e mensagens diretas. A conversa é só nos comentários de cada encontro.
- Edição de comentário, reações, imagens e links clicáveis em comentários.
- Criação de comunidades ou de interesses pelos usuários.
- Lista de membros de uma comunidade.
- Encontro em mais de uma comunidade, ou troca do público depois de criado.
- Filtros na lista de próximos além do público (por data, bairro ou vagas livres).
- Notificações por email ou push. Alterações, cancelamentos e comentários aparecem só dentro do app.
- Envio de laudo. A validação é só por autodeclaração.
- Mapa e geolocalização.
- Outras cidades além de Tubarão-SC.
- Perfil público com interesses.
- Avaliação ou denúncia de encontros ou de comentários.
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
- **Dado** o criador, **quando** abre o próprio encontro, **então** vê o primeiro nome e a foto (ou a inicial) de cada confirmado e se ele leva acompanhante.
- **Dado** um usuário que criou encontros futuros e confirmou presença em outros, **quando** exclui a conta, **então** os encontros dele são cancelados, as presenças dele são liberadas e o perfil e a autodeclaração são apagados.
- **Dado** um usuário que acabou de aceitar o termo, **quando** chega ao passo de comunidades, **então** pode marcar quantas quiser, inclusive nenhuma, e seguir.
- **Dado** um usuário que aceitou uma versão anterior do termo, **quando** entra no app, **então** precisa aceitar a versão atual antes de ver qualquer encontro.
- **Dado** um usuário fora de uma comunidade, **quando** entra nela, **então** passa a ver os próximos encontros dela em "Próximos" e na página da comunidade, e a contagem de membros aumenta em 1.
- **Dado** um usuário que não é membro de uma comunidade, **quando** abre "Próximos" ou a página dela, **então** não vê os encontros dela, só o número de encontros futuros.
- **Dado** um membro de RPG e de cinema, **quando** filtra "Próximos" por RPG, **então** vê só os próximos encontros de RPG. O filtro oferece só "Todos", "Abertos", RPG e cinema.
- **Dado** um usuário com um filtro escolhido em "Próximos", **quando** recarrega a página ou volta para ela, **então** o mesmo filtro continua aplicado.
- **Dado** um membro de uma comunidade, **quando** abre "Comunidades", **então** cada comunidade dele tem um link "Ver encontros" que leva à página dela, com os próximos encontros.
- **Dado** um membro que confirmou presença num encontro da comunidade, **quando** sai da comunidade, **então** a presença continua e o encontro segue em "meus encontros".
- **Dado** um usuário criando um encontro, **quando** abre o campo de público, **então** vê "Aberto" e só as comunidades das quais é membro, sem nada pré-marcado. Sem escolher, o cadastro é recusado.
- **Dado** um encontro já criado, **quando** o criador o edita, **então** o público não pode ser alterado.
- **Dado** um usuário que vê um encontro que ainda não terminou, **quando** envia um comentário de até 500 caracteres, **então** o comentário aparece no fim da lista, com o primeiro nome e a foto dele, e sem dizer se ele confirmou presença.
- **Dado** um comentário com mais de 500 caracteres, ou vazio, **quando** o usuário tenta enviar, **então** o envio é recusado e ele vê o motivo.
- **Dado** o criador do encontro, **quando** comenta, **então** o comentário dele aparece com o selo "organizador".
- **Dado** o autor de um comentário ou o criador do encontro, **quando** apaga o comentário, **então** no lugar aparece "Comentário apagado" e o texto deixa de existir no banco. Qualquer outro usuário não vê a opção de apagar.
- **Dado** um encontro que já terminou ou foi cancelado, **quando** alguém abre o encontro, **então** os comentários aparecem só para leitura e não dá para comentar.
- **Dado** um encontro que terminou há mais de 30 dias, **quando** o job diário roda, **então** os comentários dele são apagados.
- **Dado** um usuário que exclui a conta, **quando** a exclusão termina, **então** os comentários dele viram "Comentário apagado" e a participação dele nas comunidades é removida.
- **Dado** qualquer ação que muda dados (confirmar, cancelar presença, cancelar encontro, entrar ou sair de comunidade, apagar comentário, excluir conta), **quando** o usuário aciona, **então** o app pede uma confirmação explícita antes de executar.

## Constraints & dependencies

- **Prazo do hackathon (HackBrasil, https://hackbrasil.com/).** A entrega final é em **30/11/2026**, com uma demo funcionando e um vídeo de no máximo 3 minutos. **Depois de 30/11/2026, nenhuma alteração nem commit no repositório.**
- **O repositório é público**, por exigência do hackathon. Nenhum dado real de usuário, segredo ou credencial pode ir para o repositório.
- **Orçamento zero.** Só ferramentas com plano gratuito e sem domínio próprio, usando o subdomínio que a hospedagem oferece.
- **LGPD.** A autodeclaração de autismo é **dado pessoal sensível** (saúde). Exige consentimento explícito e direito de exclusão, que já estão no escopo. Os comentários são texto livre e podem receber dado sensível por descuido, daí o aviso no campo e a retenção de 30 dias (minimização).
- **Ordem de entrega** (cada fatia deixa a demo funcionando):
  1. comunidades (as 9, entrar e sair, páginas);
  2. público do encontro (campo, visibilidade, etiqueta, migração para "Aberto");
  3. passo de comunidades no onboarding e a faixa para contas antigas;
  4. termo v2 com reaceite;
  5. comentários, com a foto também na lista de confirmados e o job de apagamento de 30 dias no mesmo card;
  6. landing (protótipo da grade de hexágonos, depois o texto);
  7. acesso à página da comunidade ("Ver encontros", nº de encontros futuros, etiqueta com link);
  8. filtro por público em "Próximos";
  9. personalidade nas telas (protótipo de direções, depois aplicação).

  O termo v2 (4) entra em produção **antes** dos comentários (5): comentário sem o termo expõe nome e foto sem consentimento. O apagamento de 30 dias vai no mesmo card dos comentários, porque o termo o promete. **Linha de corte:** se faltar tempo, a landing é simplificada primeiro (só texto e FAQ, sem a grade nova), e depois o onboarding (só a faixa). As fatias 1, 2, 4 e 5 são o núcleo.
- **Stack:** continua Postgres (Neon) e Vercel, sem serviço novo. Comentários e limite de envio ficam no Postgres. Cada operador novo de dados (MongoDB, Cloudflare, Upstash...) exigiria atualizar o termo.
- **Observabilidade:** cada fatia já entrega os próprios eventos, alertas e painéis (`docs/agents/observability.md`).
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

    Paleta "Tinta e mel", escolhida num protótipo em 18/11/2026 para dar mais vida às telas: a cor forte fica em botões, filtros, hero e destaques, e os fundos continuam suaves.

    | Uso | Cor |
    |---|---|
    | Fundo (azulado claro) | `#F3F4FA` |
    | Superfície | `#FFFFFF` |
    | Borda | `#DCDFEE`, reforçada `#C3C8E0` |
    | Texto | `#191C2E` |
    | Texto secundário | `#4E5470` |
    | Primária (azul-tinta) | `#2F3D8F`, hover `#1F2A5C` (também o fundo do hero) |
    | Etiqueta | fundo `#E4E7F6`, texto `#2F3D8F` |
    | Mel | `#F5A524`, hover `#D97706` |
    | Mel claro | fundo `#FFF0C7`, texto `#8A4B00` |

    Todo par de texto e fundo passa no WCAG 2.1 AA; o teste `src/app/palette.test.ts` confere os tokens do `globals.css`.

  - Fonte: Inter em todo o app. O nome "iniciativa" vai em Inter Bold, em minúsculas, com espaçamento entre letras levemente fechado.
  - Logo: o d20 visto de frente. Hexágono sólido em azul-tinta, com a face de cima, um triângulo, em mel.
  - O hexágono remete ao d20, e não a uma colmeia: a face em triângulo deixa isso claro. Hexágonos nunca aparecem encaixados lado a lado.
  - Comunidades: cada uma tem um tom suave e um ícone, escolhidos no protótipo do card #81 (direção "cor e ícone por comunidade"). Aparecem no ícone ao lado do nome na lista de comunidades e no título da página da comunidade, numa faixa e num ícone no card de encontro de comunidade, e numa etiqueta com o nome acima do título na página do encontro. O encontro aberto fica neutro. O ícone é só enfeite: o nome escrito, ou o contexto da tela, continua sendo a informação. A fonte das cores é `src/app/(app)/community-theme.ts`, com teste de contraste.

    | Comunidade | Fundo | Texto e ícone | Ícone (Lucide) |
    |---|---|---|---|
    | Ar livre | `#E3F1E4` | `#1F5130` | Trees |
    | Academia | `#FCE7E3` | `#8A2E1C` | Dumbbell |
    | RPG | `#EDE7F6` | `#4C2F7A` | Swords |
    | Card games | `#E1EEF7` | `#1E4E79` | Spade |
    | Cinema | `#F7E6EE` | `#7A2350` | Clapperboard |
    | Música | `#FDF0D9` | `#7A4A06` | Music |
    | Clube do livro | `#EFE8DD` | `#5A4128` | BookOpen |
    | Corrida | `#E0F2F1` | `#0F5953` | Timer |
    | Caminhada | `#EEF2E0` | `#4A5A14` | Footprints |

### Riskiest assumptions

São quatro premissas, e qualquer uma delas, se falhar, derruba o MVP:

1. **Adesão:** o público controlado se cadastra e usa um webapp para isso.
2. **Iniciativa:** os jovens propõem encontros, e não apenas confirmam presença nos dos outros.
3. **Comparecimento:** quem confirma presença vai de fato ao encontro.
4. **Conversa no app:** os usuários combinam os detalhes nos comentários, em vez de levar a conversa para o WhatsApp.

## Open questions

| Question | Owner | Status |
|---|---|---|
| O programa SIGMA PARK tem exigências próprias de entrega, prazo ou relatório além das do hackathon? | Autor do projeto (Gustavo) | Aberta |
| Qual o texto do termo de consentimento LGPD e da política de privacidade, e quem responde como controlador dos dados? | Autor do projeto (Gustavo) | Resolvida: o controlador é o autor, como pessoa física. O termo v1.0 fica em `/boas-vindas` (resumo) e em `/privacidade` (texto completo). Quem aceitou outra versão aceita de novo antes de usar o app. |
| Qual o texto do termo v2 (nome e foto visíveis, comunidades, comentários, retenção de 30 dias)? | Autor do projeto (Gustavo) | Aberta: o rascunho sai junto com a fatia 4 e passa pela revisão do autor. |
| Qual a frase de descrição de cada uma das 9 comunidades? | Autor do projeto (Gustavo) | Aberta: o rascunho sai junto com a fatia 1. |
| Como o autor vai colher o retorno dos organizadores no piloto (formulário, conversa)? | Autor do projeto (Gustavo) | Aberta |
| Qual a data de início do piloto de 8 semanas? | Autor do projeto (Gustavo) | Aberta |
