import { cookies } from "next/headers";
import { getServerEnv } from "@/shared/env";
import { authCookieAttributes } from "./auth-cookie";
import {
  createSignupConsentToken,
  SIGNUP_CONSENT_COOKIE,
  SIGNUP_CONSENT_MAX_AGE_SECONDS,
  verifySignupConsentToken,
} from "./signup-consent-token";

// A conta só nasce depois do aceite dos termos. Quem aceita em /boas-vindas recebe este
// cookie assinado (HMAC com o BETTER_AUTH_SECRET) e vai para o Google pedindo cadastro.
// O hook de criação de usuário do Better Auth recusa o cadastro sem um aceite válido.
// O cookie guarda só a versão do termo e o horário do aceite — nenhum dado pessoal.

// Chamado pela ação de /boas-vindas quando a pessoa aceita os dois termos sem ter conta.
export async function grantSignupConsent(version: string): Promise<void> {
  const store = await cookies();
  store.set(
    SIGNUP_CONSENT_COOKIE,
    createSignupConsentToken(getServerEnv().BETTER_AUTH_SECRET, version),
    {
      ...authCookieAttributes,
      path: "/",
      maxAge: SIGNUP_CONSENT_MAX_AGE_SECONDS,
    },
  );
}

export type SignupConsentCheck =
  | { valid: true }
  | {
      valid: false;
      reason: "missing" | "invalid_or_expired" | "other_version";
      cookieNames: string[];
    };

// Chamado depois do cadastro: lê, apaga e diz se o aceite era válido para esta versão.
// Na falha, diz o motivo e os nomes (só os nomes) dos cookies recebidos, para o log.
export async function consumeSignupConsent(version: string): Promise<SignupConsentCheck> {
  const store = await cookies();
  const cookieNames = store.getAll().map((cookie) => cookie.name);
  const token = store.get(SIGNUP_CONSENT_COOKIE)?.value;
  store.delete(SIGNUP_CONSENT_COOKIE);
  const secret = getServerEnv().BETTER_AUTH_SECRET;
  if (!token) return { valid: false, reason: "missing", cookieNames };
  if (!verifySignupConsentToken(token, secret)) {
    return { valid: false, reason: "invalid_or_expired", cookieNames };
  }
  if (!verifySignupConsentToken(token, secret, { version })) {
    return { valid: false, reason: "other_version", cookieNames };
  }
  return { valid: true };
}
