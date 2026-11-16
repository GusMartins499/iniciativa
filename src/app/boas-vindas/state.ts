import type { onboardingCopy } from "@/modules/users";

export type OnboardingCopy = typeof onboardingCopy;

export type OnboardingState = {
  code: "VALIDATION_FAILED" | "UNAUTHENTICATED" | "UNEXPECTED" | null;
};
