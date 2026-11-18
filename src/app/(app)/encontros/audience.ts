import { z } from "zod";
import { COMMUNITIES, type CommunitySlug } from "@/modules/communities/client";
import { type AudienceFilter, meetupsCopy, OPEN_AUDIENCE } from "@/modules/meetups/client";

export type AudienceOption = { value: string; label: string };

// Etiqueta do card: o nome da comunidade, ou "Aberto" para todos.
export function audienceTag(communitySlug: string | null): string {
  if (communitySlug === null) return meetupsCopy.tags.open;
  return COMMUNITIES.find((community) => community.slug === communitySlug)?.name ?? communitySlug;
}

// "Aberto (todos)" e só as comunidades de que o criador participa, na ordem da lista fixa.
export function audienceOptions(memberSlugs: readonly string[]): AudienceOption[] {
  return [
    { value: OPEN_AUDIENCE, label: meetupsCopy.form.audienceOpen },
    ...COMMUNITIES.filter((community) => memberSlugs.includes(community.slug)).map((community) => ({
      value: community.slug,
      label: community.name,
    })),
  ];
}

// Na URL o filtro fica em português (?publico=abertos, ?publico=rpg); "Todos" é a URL sem
// parâmetro, para o padrão não depender de nada na query.
const OPEN_FILTER_PARAM = "abertos";

export type AudienceFilterOption = {
  filter: AudienceFilter;
  label: string;
  href: string;
};

export function audienceFilterOptions(memberSlugs: readonly string[]): AudienceFilterOption[] {
  return [
    { filter: "all", label: meetupsCopy.filter.all, href: "/encontros" },
    {
      filter: "open",
      label: meetupsCopy.filter.open,
      href: `/encontros?publico=${OPEN_FILTER_PARAM}`,
    },
    ...COMMUNITIES.filter((community) => memberSlugs.includes(community.slug)).map((community) => ({
      filter: community.slug,
      label: community.name,
      href: `/encontros?publico=${community.slug}`,
    })),
  ];
}

const communitySlugSchema = z.enum(COMMUNITIES.map((community) => community.slug));

// Valor inválido, repetido ou de comunidade alheia vira "all": a tela nunca quebra por causa
// da URL, e a query continua restrita às comunidades da pessoa.
export function parseAudienceFilter(
  raw: unknown,
  memberSlugs: readonly CommunitySlug[],
): AudienceFilter {
  if (raw === OPEN_FILTER_PARAM) return "open";
  const slug = communitySlugSchema.safeParse(raw);
  return slug.success && memberSlugs.includes(slug.data) ? slug.data : "all";
}
