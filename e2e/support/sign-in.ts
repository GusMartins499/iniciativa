import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import { authCookieAttributes } from "@/shared/auth/auth";
import * as schema from "@/shared/auth/schema";
import type { Database } from "@/shared/db";
import type { ServerEnv } from "@/shared/env";

export type StorageState = {
  cookies: {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax" | "Strict" | "None";
  }[];
  origins: [];
};

type TestUser = { name: string; email: string; image?: string };

// Único ponto que conhece o formato da sessão: o plugin test-utils do Better Auth grava
// a sessão no banco e assina o cookie como o app espera. Se a lib mudar, quebra só aqui.
export async function createSignedInUsers<Key extends string>(
  db: Database,
  env: ServerEnv,
  users: Record<Key, TestUser>,
): Promise<Record<Key, { id: string; storageState: StorageState }>> {
  const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    advanced: { defaultCookieAttributes: authCookieAttributes },
    plugins: [testUtils()],
  });
  const { test } = await auth.$context;

  const entries = await Promise.all(
    Object.entries<TestUser>(users).map(async ([key, data]) => {
      const user = await test.saveUser(test.createUser(data));
      const { cookies } = await test.login({ userId: user.id });
      const storageState: StorageState = {
        cookies: cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires ?? -1,
          httpOnly: cookie.httpOnly ?? true,
          // O cookie do app é Secure; o Chromium aceita Secure em http://localhost.
          secure: cookie.secure ?? true,
          sameSite: cookie.sameSite ?? "Lax",
        })),
        origins: [],
      };
      return [key, { id: user.id, storageState }] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Key, { id: string; storageState: StorageState }>;
}
