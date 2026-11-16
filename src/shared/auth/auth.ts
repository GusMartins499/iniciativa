import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import * as schema from "./schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não configurada`);
  }
  return value;
}

function createAuth() {
  const baseURL = requireEnv("BETTER_AUTH_URL");
  return betterAuth({
    baseURL,
    secret: requireEnv("BETTER_AUTH_SECRET"),
    // Os deploys de preview da Vercel têm outra URL: só a de produção é confiável.
    trustedOrigins: [baseURL],
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    socialProviders: {
      google: {
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      },
    },
    advanced: {
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: true },
    },
    onAPIError: {
      errorURL: "/entrar?erro=google",
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
