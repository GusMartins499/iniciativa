import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/shared/db";
import { getServerEnv } from "@/shared/env";
import { logger } from "@/shared/logger";
import { authCookieAttributes } from "./auth-cookie";
import * as schema from "./schema";
import {
  readCookie,
  SIGNUP_CONSENT_COOKIE,
  verifySignupConsentToken,
} from "./signup-consent-token";

// Exportado para a instância de teste do e2e assinar o mesmo cookie que o app lê.
export { authCookieAttributes };

function createAuth() {
  const env = getServerEnv();
  const baseURL = env.BETTER_AUTH_URL;
  return betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    // Os deploys de preview da Vercel têm outra URL: só a de produção é confiável.
    trustedOrigins: [baseURL],
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // Só o "Confirmar e entrar" de /boas-vindas, depois do aceite dos termos, fala com
        // o Google, e ele pede o cadastro (requestSignUp). Qualquer outro login com Google
        // não cria conta.
        disableImplicitSignUp: true,
      },
    },
    // O app não chama APIs do Google; os tokens do OAuth ficam cifrados no banco mesmo assim.
    account: { encryptOAuthTokens: true },
    advanced: {
      defaultCookieAttributes: authCookieAttributes,
    },
    databaseHooks: {
      user: {
        create: {
          // Segunda trava: mesmo pedindo cadastro, sem o aceite assinado a conta não nasce.
          async before(_user, ctx) {
            const headers = ctx?.headers ?? ctx?.request?.headers;
            const token = readCookie(headers?.get("cookie"), SIGNUP_CONSENT_COOKIE);
            if (!verifySignupConsentToken(token, env.BETTER_AUTH_SECRET)) {
              logger.warn({ event: "auth.signup_rejected", reason: "missing_consent" });
              return false;
            }
            return undefined;
          },
        },
      },
    },
    onAPIError: {
      // O Better Auth acrescenta ?error=<código> a esta URL.
      errorURL: "/",
      onError(error) {
        // Sem token, cookie ou e-mail no payload.
        const message = error instanceof Error ? error.message : "unknown";
        logger.error({ event: "auth.oauth_failed", message });
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
