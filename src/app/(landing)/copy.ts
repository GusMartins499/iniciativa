// Textos da tela inicial (antes do login). Botão e erro do login ficam em signInCopy.
export const landingCopy = {
  title: "Promovemos encontros face a face para jovens autistas",
  lead: "Entre nas suas comunidades, proponha um encontro e divirta-se.",
  howItWorksTitle: "Como funciona",
  steps: [
    {
      key: "sign-in",
      title: "Entre com a sua conta do Google",
      text: "Use a conta que você já tem. Não é preciso criar senha.",
    },
    {
      key: "communities",
      title: "Escolha as suas comunidades",
      text: "RPG, Cinema, Corrida, Clube do livro e outras. Entre nas que combinam com você e saia quando quiser.",
    },
    {
      key: "initiative",
      title: "Tome INICIATIVA",
      text: "Ninguém precisa esperar convite.",
    },
    {
      key: "choose",
      title: "Proponha ou escolha um encontro",
      text: "Para propor, escolha a data, o horário, o número de vagas e um lugar público, como uma praça, um café, uma biblioteca ou um cinema.",
    },
    {
      key: "comments",
      title: "Combine nos comentários",
      text: "Tire dúvidas e acerte os detalhes com as outras pessoas nos comentários do encontro.",
    },
    {
      key: "go",
      title: "Confirme presença e vá",
      text: "Vá sozinho ou leve um acompanhante. Faça amigos e divirta-se.",
    },
  ],
  communitiesTitle: "As comunidades",
  communitiesText:
    "Cada encontro é aberto a todos ou é de uma comunidade. Os encontros de uma comunidade aparecem só para quem entrou nela.",
  faqTitle: "Perguntas frequentes",
  faq: [
    {
      question: "Quem vê o meu nome e a minha foto?",
      answer:
        "Quem criou o encontro vê o primeiro nome e a foto de quem confirmou presença. As outras pessoas veem só quantas vagas estão ocupadas. Se você comentar, o seu primeiro nome e a sua foto aparecem no comentário para quem vê o encontro. Ninguém vê quem está numa comunidade.",
    },
    {
      question: "Posso desistir depois de confirmar?",
      answer: "Sim, até o horário de início. A sua vaga volta a ficar livre.",
    },
    {
      question: "E se o encontro estiver lotado?",
      answer:
        "Não dá para confirmar. Se alguém desistir, a vaga fica livre para quem chegar primeiro.",
    },
    {
      question: "E se o encontro mudar ou for cancelado?",
      answer:
        'O aviso aparece dentro do app, em "Meus encontros". O app não manda notificações. Para combinar os detalhes, use os comentários do encontro.',
    },
    {
      question: "Posso criar uma comunidade nova?",
      answer: "Ainda não. Por enquanto existem só estas 9.",
    },
    {
      question: "Posso apagar a minha conta?",
      answer:
        'Sim, a qualquer momento, em "Minha conta". Isso apaga os seus dados, inclusive a sua autodeclaração.',
    },
  ],
} as const;
