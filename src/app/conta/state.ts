import type { accountCopy } from "@/modules/users";

export type DeleteAccountState = { code: keyof typeof accountCopy.errors | null };
