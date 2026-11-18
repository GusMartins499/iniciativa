export const commentsCopy = {
  title: "Comentários",
  empty: "Ninguém comentou ainda.",
  organizer: "organizador",
  deleted: "Comentário apagado",
  readOnly: "Os comentários deste encontro estão fechados. Dá para ler, mas não para comentar.",
  refresh: "Atualizar comentários",
  fieldLabel: "Escreva um comentário",
  privacyHint:
    "O seu primeiro nome e a sua foto aparecem para quem vê este encontro. Não escreva dados pessoais nem de saúde.",
  send: "Enviar comentário",
  delete: "Apagar comentário",
  deleteDescription: "O texto sai do app e no lugar fica “Comentário apagado”.",
  back: "Voltar",
  errors: {
    VALIDATION_FAILED: "Algo deu errado. Tente de novo.",
    COMMENT_EMPTY: "Escreva o comentário antes de enviar.",
    COMMENT_TOO_LONG: "O comentário pode ter no máximo 500 caracteres.",
    NOT_FOUND: "Este encontro não existe.",
    MEETUP_ENDED: "Este encontro já terminou. Não é mais possível comentar.",
    MEETUP_CANCELLED: "Este encontro foi cancelado. Não é mais possível comentar.",
    RATE_LIMITED: "Você enviou muitos comentários seguidos. Espere um minuto.",
    NOT_COMMENT_AUTHOR: "Só quem escreveu ou quem criou o encontro pode apagar este comentário.",
    ONBOARDING_REQUIRED: "Conclua o seu cadastro antes de continuar.",
    UNAUTHENTICATED: "Entre com o Google antes de continuar.",
    UNEXPECTED: "Algo deu errado. Tente de novo.",
  },
} as const;

export type CommentActionCode = keyof typeof commentsCopy.errors;
