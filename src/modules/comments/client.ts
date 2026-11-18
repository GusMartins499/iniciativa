// Entrada pública para componentes de cliente: só código sem dependência de servidor.
export { type CommentInput, COMMENT_MAX_CHARS, commentInputSchema } from "./comment-input";
export type { CommentView } from "./comments";
export { type CommentActionCode, commentsCopy } from "./copy";
