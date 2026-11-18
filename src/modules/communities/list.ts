// Fonte única das comunidades, na ordem de exibição. A tabela `communities` recebe as
// mesmas linhas pela migração; o teste de communities.test.ts garante que não divergem.
export const COMMUNITIES = [
  { slug: "ar-livre", name: "Ar livre" },
  { slug: "academia", name: "Academia" },
  { slug: "rpg", name: "RPG" },
  { slug: "card-games", name: "Card games" },
  { slug: "cinema", name: "Cinema" },
  { slug: "musica", name: "Música" },
  { slug: "clube-do-livro", name: "Clube do livro" },
  { slug: "corrida", name: "Corrida" },
  { slug: "caminhada", name: "Caminhada" },
] as const;

export type CommunitySlug = (typeof COMMUNITIES)[number]["slug"];
export type Community = { slug: CommunitySlug; name: string };

export function findCommunity(slug: string): Community | null {
  return COMMUNITIES.find((community) => community.slug === slug) ?? null;
}
