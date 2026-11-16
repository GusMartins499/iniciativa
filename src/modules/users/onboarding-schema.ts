import { z } from "zod";

// Compartilhado entre o formulário (cliente) e o caso de uso (servidor).
export const onboardingSchema = z.object({
  declaration: z.boolean().refine((checked) => checked, { message: "VALIDATION_FAILED" }),
  consent: z.boolean().refine((checked) => checked, { message: "VALIDATION_FAILED" }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
