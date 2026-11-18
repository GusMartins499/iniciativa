import { COMMUNITIES } from "@/modules/communities/client";
import { meetupsCopy, OPEN_AUDIENCE } from "@/modules/meetups/client";

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
