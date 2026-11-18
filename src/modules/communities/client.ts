// Entrada pública para componentes de cliente: só código sem dependência de servidor.
export { communitiesCopy } from "./copy";
export { type JoinCommunitiesInput, joinCommunitiesSchema } from "./join-communities-schema";
export { type Community, COMMUNITIES, type CommunitySlug } from "./list";
export type { CommunitySummary } from "./communities";
