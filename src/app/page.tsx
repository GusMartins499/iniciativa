import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/modules/users";

export default async function HomePage() {
  const guard = await requireOnboardedUser();
  if (!guard.ok) {
    redirect(guard.error.code === "UNAUTHENTICATED" ? "/entrar" : "/boas-vindas");
  }

  return (
    <p className="text-muted-foreground">
      Olá, {guard.data.name.split(" ")[0]}. Em breve: encontros presenciais em Tubarão-SC.
    </p>
  );
}
