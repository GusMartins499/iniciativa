import { cookies, headers } from "next/headers";
import { getAuth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  // headers() primeiro: torna a rota dinâmica antes de exigir as variáveis do Better Auth.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) {
    return null;
  }
  return { id: session.user.id, name: session.user.name };
}

// Depois da exclusão a sessão já não existe no banco; os cookies do Better Auth
// também saem, para o navegador não guardar um token inútil.
export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  for (const cookie of store.getAll()) {
    if (cookie.name.includes("better-auth.")) store.delete(cookie.name);
  }
}
