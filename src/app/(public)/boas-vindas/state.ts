export type OnboardingState = {
  // SIGN_UP_READY: aceite gravado em cookie assinado; o formulário segue para o Google.
  code: "VALIDATION_FAILED" | "UNAUTHENTICATED" | "UNEXPECTED" | "SIGN_UP_READY" | null;
};
