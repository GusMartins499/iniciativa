import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Checagem otimista: só olha se existe o cookie de sessão.
// A decisão de acesso real é sempre o requireOnboardedUser no servidor.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Os ícones do app ficam de fora: a aba e o atalho do iOS os pedem também sem login.
  matcher: [
    "/((?!entrar|api/auth|_next/static|_next/image|favicon.ico|icon\\.svg|apple-icon\\.png).*)",
  ],
};
