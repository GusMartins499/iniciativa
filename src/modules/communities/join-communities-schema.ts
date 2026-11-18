import { z } from "zod";
import { COMMUNITIES } from "./list";

// Compartilhado entre o passo de comunidades do onboarding (cliente) e a Server Action.
// O slug é conferido contra a lista fixa no caso de uso; aqui só o formato.
export const joinCommunitiesSchema = z.object({
  slugs: z.array(z.string().max(64)).max(COMMUNITIES.length),
});

export type JoinCommunitiesInput = z.infer<typeof joinCommunitiesSchema>;
