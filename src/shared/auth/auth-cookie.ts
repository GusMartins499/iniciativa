// Atributos dos cookies de autenticação; o e2e assina a sessão com os mesmos.
export const authCookieAttributes = { httpOnly: true, sameSite: "lax", secure: true } as const;
