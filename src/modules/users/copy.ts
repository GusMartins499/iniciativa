// Versão do termo aceito; muda sempre que o texto do termo mudar. Quem aceitou outra
// versão precisa aceitar de novo antes de usar o app.
export const CONSENT_VERSION = "v1.0";

const controllerName = "Gustavo Martins";
const controllerEmail = "gustavosm994@gmail.com";

export const onboardingCopy = {
  title: "Boas-vindas ao iniciativa",
  intro: "Para criar a sua conta, precisamos de duas confirmações. Sem elas, a conta não é criada.",
  outdatedConsent:
    "O termo de consentimento mudou. Leia a nova versão e marque as duas caixas para continuar.",
  declarationLabel:
    "Sou autista, com nível de suporte 1 ou com autonomia para participar de encontros, e tenho 18 anos ou mais.",
  consentLabel: "Li e aceito o termo de consentimento abaixo.",
  consentTitle: "Termo de consentimento — versão 1.0",
  consentText: [
    "A sua autodeclaração de autismo é um dado de saúde. A lei chama isso de dado pessoal sensível (LGPD).",
    "Usamos a autodeclaração só para liberar o seu acesso ao iniciativa. Ela não aparece para outras pessoas.",
    "Quem cria um encontro vê o seu primeiro nome e se você leva acompanhante. As outras pessoas veem só o número de vagas ocupadas.",
    "Os dados ficam guardados em serviços fora do Brasil: Google, Vercel e Neon.",
    "Você pode excluir a sua conta a qualquer momento. Isso apaga os seus dados e encerra este consentimento.",
    `Responsável pelos dados: ${controllerName}. Contato: ${controllerEmail}.`,
  ],
  privacyLink: "Ler a política de privacidade completa",
  continueButton: "Continuar",
  dialogTitle: "Confirmar e entrar",
  dialogDescription:
    "Você confirma a sua autodeclaração e aceita o termo de consentimento. Depois disso, você entra com o Google e a sua conta é criada.",
  dialogConfirm: "Confirmar e entrar",
  dialogCancel: "Voltar",
  errors: {
    VALIDATION_FAILED: "Marque as duas caixas para continuar.",
    UNAUTHENTICATED: "Você precisa entrar com o Google antes de continuar.",
    UNEXPECTED: "Algo deu errado. Tente de novo.",
    SIGN_UP_FAILED: "Não foi possível entrar com o Google. Tente de novo.",
  },
} as const;

export const signInCopy = {
  button: "Entrar com Google",
  error: "Não foi possível entrar com o Google. Tente de novo.",
} as const;

export const accountCopy = {
  title: "Minha conta",
  link: "Minha conta",
  googleAccount: (email: string) => `Conta Google: ${email}`,
  signOutTitle: "Sair da conta",
  signOutDescription:
    "Você sai neste aparelho. Os seus encontros e presenças continuam salvos. Para voltar, entre de novo com o Google.",
  signOutButton: "Sair da conta",
  signOutError: "Não foi possível sair. Tente de novo.",
  deleteTitle: "Excluir conta",
  deleteConsequences: [
    "Apaga o seu perfil, a sua autodeclaração e o seu consentimento.",
    "Cancela os encontros futuros que você criou.",
    "Cancela as suas presenças confirmadas.",
  ],
  deleteIrreversible: "Não é possível desfazer.",
  deleteButton: "Excluir minha conta",
  deleteDescription:
    "Isto apaga o seu perfil, a sua autodeclaração e o seu consentimento, cancela os encontros futuros que você criou e as suas presenças confirmadas. Não é possível desfazer.",
  back: "Voltar",
  deleted: "Sua conta foi excluída.",
  errors: {
    ONBOARDING_REQUIRED: "Conclua o seu cadastro antes de continuar.",
    UNAUTHENTICATED: "Você precisa entrar com o Google antes de continuar.",
    UNEXPECTED: "Algo deu errado. Nada foi apagado. Tente de novo.",
  },
} as const;

// "after" é o texto que vem depois da lista, dentro da mesma seção.
type PrivacySection = { title: string; paragraphs?: string[]; items?: string[]; after?: string[] };

export const privacyCopy: {
  title: string;
  version: string;
  sections: PrivacySection[];
  back: string;
} = {
  title: "Política de privacidade e termo de consentimento",
  version: "Versão 1.0",
  sections: [
    {
      title: "1. Quem é responsável pelos seus dados",
      paragraphs: [
        `O responsável pelos seus dados é ${controllerName}, autor do iniciativa.`,
        `Para qualquer pedido sobre os seus dados, escreva para ${controllerEmail}.`,
      ],
    },
    {
      title: "2. Para quem é o iniciativa",
      paragraphs: [
        "O iniciativa é para pessoas autistas com 18 anos ou mais, com nível de suporte 1 ou com autonomia para ir sozinhas a um encontro.",
        "Neste momento, ele funciona só em um piloto em Tubarão-SC.",
      ],
    },
    {
      title: "3. Quais dados guardamos",
      items: [
        "Da sua conta Google: nome, email e foto.",
        "Da sua entrada no app: endereço IP e o tipo de navegador que você usa.",
        "A sua autodeclaração: que você é autista (nível de suporte 1 ou com autonomia) e que tem 18 anos ou mais.",
        "A data em que você aceitou este termo e a versão aceita.",
        "Os encontros que você cria e as presenças que você confirma, incluindo se você leva acompanhante.",
      ],
    },
    {
      title: "4. A autodeclaração é um dado sensível",
      paragraphs: [
        "A autodeclaração de autismo é um dado de saúde. A LGPD chama isso de dado pessoal sensível.",
        "Só guardamos esse dado com o seu consentimento, dado neste termo.",
      ],
    },
    {
      title: "5. Para que usamos os seus dados",
      items: [
        "A autodeclaração serve só para liberar o seu acesso. Ela nunca aparece para outras pessoas.",
        "O nome e o email servem para você entrar no app.",
        "Os encontros e as presenças servem para o app funcionar.",
      ],
    },
    {
      title: "6. Quem vê os seus dados",
      items: [
        "Quem cria um encontro vê o primeiro nome de quem confirmou presença e se essa pessoa leva acompanhante.",
        'As outras pessoas veem só quantas vagas estão ocupadas, por exemplo "7 de 10 vagas".',
        "Não vendemos os seus dados e não passamos os seus dados para ninguém usar com outro objetivo.",
      ],
    },
    {
      title: "7. Serviços que usamos",
      items: [
        "Google: para você entrar com a sua conta Google.",
        "Vercel: para o site funcionar.",
        "Neon: para guardar o banco de dados.",
      ],
      after: ["Esses serviços guardam dados em servidores fora do Brasil."],
    },
    {
      title: "8. Por quanto tempo guardamos",
      items: [
        "Guardamos os seus dados enquanto a sua conta existir.",
        "Os registros técnicos do site não têm o seu nome nem o seu email e são apagados sozinhos em pouco tempo.",
        "As cópias de segurança do banco de dados guardam um histórico de até 6 horas. Depois desse prazo, elas são apagadas sozinhas.",
      ],
    },
    {
      title: "9. Os seus direitos",
      items: [
        `Você pode pedir para ver os dados que guardamos sobre você, escrevendo para ${controllerEmail}.`,
        `Você pode pedir para corrigir um dado, escrevendo para ${controllerEmail}.`,
        'Você pode excluir a sua conta a qualquer momento, em "Minha conta".',
      ],
    },
    {
      title: "10. Excluir a conta",
      paragraphs: ["Ao excluir a conta:"],
      items: [
        "o seu perfil, a sua autodeclaração e o seu consentimento são apagados;",
        "os encontros futuros que você criou são cancelados;",
        "as suas presenças confirmadas são canceladas;",
        "os encontros que já aconteceram continuam no app, mas sem o seu nome.",
      ],
      after: ["Não é possível desfazer."],
    },
    {
      title: "11. Retirar o consentimento",
      paragraphs: [
        "O consentimento é necessário para usar o iniciativa. Para retirar o consentimento, exclua a sua conta.",
      ],
    },
    {
      title: "12. Mudanças neste termo",
      paragraphs: [
        "Se este termo mudar, o app vai pedir que você leia e aceite a nova versão antes de continuar.",
      ],
    },
  ],
  back: "Voltar para o início",
};
