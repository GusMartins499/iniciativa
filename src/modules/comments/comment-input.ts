import { z } from "zod";

export const COMMENT_MAX_CHARS = 500;

// Compartilhado entre o formulário (cliente) e o caso de uso (servidor). A mensagem é o
// código de erro, que vira texto pelo copy. O limite conta caracteres (code points), como o
// char_length do banco: emoji vale 1, e o .max() do Zod contaria 2.
export const commentInputSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "COMMENT_EMPTY")
    .refine((body) => [...body].length <= COMMENT_MAX_CHARS, "COMMENT_TOO_LONG"),
});

export type CommentInput = z.infer<typeof commentInputSchema>;
