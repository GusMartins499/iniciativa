import type { CommunitySlug } from "./list";

// Rascunho das descrições: passa pela revisão do autor (open question do PRD).
const descriptions: Record<CommunitySlug, string> = {
  "ar-livre": "Para quem gosta de passar o tempo em parques, praças e trilhas.",
  academia: "Para quem treina ou quer começar a treinar em academia.",
  rpg: "Para quem joga ou quer aprender a jogar RPG de mesa.",
  "card-games": "Para quem joga jogos de cartas, como Magic, Pokémon e Yu-Gi-Oh.",
  cinema: "Para quem gosta de ver filmes e conversar sobre eles.",
  musica: "Para quem gosta de ouvir, tocar ou ir a shows de música.",
  "clube-do-livro": "Para quem gosta de ler e conversar sobre livros.",
  corrida: "Para quem corre ou quer começar a correr.",
  caminhada: "Para quem gosta de caminhar em grupo.",
};

// "RPG", "RPG e Cinema", "RPG, Cinema e Música".
function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

export const communitiesCopy = {
  listTitle: "Comunidades",
  listLead:
    "Entre nas comunidades dos assuntos de que você gosta. Ninguém vê quem participa, só quantas pessoas são.",
  description: (slug: CommunitySlug) => descriptions[slug],
  members: (count: number) => (count === 1 ? "1 pessoa participa" : `${count} pessoas participam`),
  memberNote: "Você participa desta comunidade.",
  seeMeetups: "Ver encontros",
  memberBadge: "Você participa",
  backToList: "Voltar para comunidades",
  aboutTitle: "Sobre a comunidade",
  // Rótulos dos números da lateral da comunidade: com o número na frente, formam as
  // mesmas frases de members e de meetupsCopy.community.upcomingCount.
  stats: {
    members: (count: number) => (count === 1 ? "pessoa participa" : "pessoas participam"),
    upcoming: (count: number) => (count === 1 ? "encontro futuro" : "encontros futuros"),
  },
  notFound: "Esta comunidade não existe.",
  joinButton: "Entrar na comunidade",
  joinDialogTitle: "Entrar na comunidade",
  joinDialogDescription: (name: string) =>
    `Você vai entrar em ${name}. Ninguém vê quem participa, só quantas pessoas são.`,
  leaveButton: "Sair da comunidade",
  leaveDialogTitle: "Sair da comunidade",
  leaveDialogDescription: (name: string) =>
    `Você vai sair de ${name}. Os encontros em que você já confirmou presença continuam em "Meus encontros".`,
  back: "Voltar",
  onboarding: {
    title: "Escolha suas comunidades",
    lead: 'Marque os assuntos de que você gosta. Os encontros dessas comunidades aparecem em "Próximos". Dá para entrar e sair depois, na página "Comunidades". Ninguém vê quem participa.',
    listLabel: "Comunidades",
    skipButton: "Pular",
    continueButton: "Continuar",
    dialogTitle: "Entrar nas comunidades",
    dialogDescription: (names: readonly string[]) =>
      `Você vai entrar em ${joinNames(names)}. Ninguém vê quem participa, só quantas pessoas são.`,
  },
  errors: {
    NOT_FOUND: "Esta comunidade não existe.",
    VALIDATION_FAILED: "Escolha só comunidades da lista.",
    ONBOARDING_REQUIRED: "Conclua o seu cadastro antes de continuar.",
    UNAUTHENTICATED: "Entre com o Google antes de continuar.",
    UNEXPECTED: "Algo deu errado. Tente de novo.",
  },
} as const;
