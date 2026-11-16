import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/modules/users";
import type { SessionUser } from "@/shared/auth";

// Guard das páginas protegidas: sem sessão → /entrar; sem autodeclaração → /boas-vindas.
export async function requirePageUser(): Promise<SessionUser> {
  const guard = await requireOnboardedUser();
  if (!guard.ok) {
    redirect(guard.error.code === "UNAUTHENTICATED" ? "/entrar" : "/boas-vindas");
  }
  return guard.data;
}
