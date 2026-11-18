// Textos da tela inicial (antes do login). Botão e erro do login ficam em signInCopy.
export const landingCopy = {
  title: "Promovemos encontros face a face para jovens autistas",
  lead: "O iniciativa é um app simples para propor um encontro em um lugar público e confirmar presença nos encontros de outras pessoas.",
  howItWorksTitle: "Como funciona",
  steps: [
    {
      key: "sign-in",
      title: "Entre com a sua conta do Google",
      text: "Use a conta que você já tem. Não é preciso criar senha.",
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
      key: "go",
      title: "Confirme presença e vá",
      text: "Vá sozinho ou leve um acompanhante. Faça amigos e divirta-se.",
    },
  ],
  faqTitle: "Perguntas frequentes",
  faq: [
    {
      question: "Quem vê que eu vou a um encontro?",
      answer:
        "As outras pessoas veem só quantas vagas estão ocupadas. Quem criou o encontro vê o seu primeiro nome e a sua foto. Se você comentar, o seu primeiro nome e a sua foto aparecem no comentário.",
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
      question: "Posso apagar a minha conta?",
      answer:
        'Sim, a qualquer momento, em "Minha conta". Isso apaga os seus dados, inclusive a sua autodeclaração.',
    },
  ],
} as const;
