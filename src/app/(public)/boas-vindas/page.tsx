import { redirect } from "next/navigation";
import { hasCompletedOnboarding, onboardingCopy as copy } from "@/modules/users";
import { getSessionUser } from "@/shared/auth";
import { getDb } from "@/shared/db";
import { completeOnboardingAction } from "./actions";
import { OnboardingForm } from "./onboarding-form";

// Termos antes da conta: quem ainda não tem conta chega aqui sem sessão, vindo do
// "Entrar com Google". Quem já concluiu o cadastro segue direto para o app.
export default async function WelcomePage() {
  const sessionUser = await getSessionUser();
  if (sessionUser && (await hasCompletedOnboarding(getDb(), sessionUser.id))) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p className="text-muted-foreground">{copy.intro}</p>
      <OnboardingForm action={completeOnboardingAction} />
    </div>
  );
}
