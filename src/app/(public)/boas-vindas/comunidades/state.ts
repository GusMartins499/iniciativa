import type { communitiesCopy } from "@/modules/communities/client";

export type JoinCommunitiesState = { code: keyof typeof communitiesCopy.errors | null };
