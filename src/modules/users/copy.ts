// Versão do termo aceito; muda sempre que o texto do termo mudar.
export const CONSENT_VERSION = "v0.1-provisorio";

export const onboardingCopy = {
  title: "Boas-vindas ao iniciativa",
  intro:
    "Antes de continuar, precisamos de duas confirmações. Sem elas, não é possível usar o app.",
  declarationLabel:
    "Sou autista, com nível de suporte 1 ou com autonomia para participar de encontros, e tenho 18 anos ou mais.",
  consentLabel: "Li e aceito o termo de consentimento abaixo.",
  consentTitle: "Termo de consentimento (PROVISÓRIO)",
  consentText: [
    "PROVISÓRIO — este texto ainda será substituído pela versão final do termo.",
    "A sua autodeclaração de autismo é um dado pessoal sensível, de saúde, protegido pela Lei Geral de Proteção de Dados (LGPD).",
    "Ela é usada apenas para permitir o seu acesso ao iniciativa e não é mostrada para outras pessoas.",
    "Você pode excluir a sua conta e esses dados a qualquer momento. As cópias de segurança automáticas do banco de dados guardam um histórico curto e são apagadas sozinhas quando esse período termina.",
  ],
  continueButton: "Continuar",
  dialogTitle: "Confirmar e entrar",
  dialogDescription:
    "Você confirma a sua autodeclaração e aceita o termo de consentimento. Depois disso, você entra no app.",
  dialogConfirm: "Confirmar e entrar",
  dialogCancel: "Voltar",
  errors: {
    VALIDATION_FAILED: "Marque as duas caixas para continuar.",
    UNAUTHENTICATED: "Você precisa entrar com o Google antes de continuar.",
    UNEXPECTED: "Algo deu errado. Tente de novo.",
  },
} as const;

export const signInCopy = {
  title: "Entrar no iniciativa",
  intro: "Use a sua conta do Google para entrar.",
  button: "Entrar com Google",
  error: "Não foi possível entrar com o Google. Tente de novo.",
} as const;

export const accountCopy = {
  title: "Minha conta",
  link: "Minha conta",
  signedInAs: (name: string) => `Você entrou como ${name}.`,
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
