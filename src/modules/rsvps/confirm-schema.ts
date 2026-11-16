import { z } from "zod";

// Compartilhado entre o painel do encontro (cliente) e o caso de uso (servidor).
export const confirmRsvpSchema = z.object({ withCompanion: z.boolean() });

export type ConfirmRsvpInput = z.infer<typeof confirmRsvpSchema>;
