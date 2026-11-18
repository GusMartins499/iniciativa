import type { communitiesCopy } from "@/modules/communities/client";

export type MembershipActionState = { code: keyof typeof communitiesCopy.errors | null };
