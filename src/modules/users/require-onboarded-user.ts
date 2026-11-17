import { and, eq, ne } from "drizzle-orm";
import { getSessionUser, type SessionUser } from "@/shared/auth";
import { type Database, getDb } from "@/shared/db";
import { err, ok, type Result } from "@/shared/result";
import { CONSENT_VERSION } from "./copy";
import { userOnboardings } from "./schema";

type GuardDeps = {
  db: Database;
  getSessionUser: () => Promise<SessionUser | null>;
};

function defaultDeps(): GuardDeps {
  return {
    // Lido só depois da sessão: headers() marca a rota como dinâmica antes de abrir o banco.
    get db() {
      return getDb();
    },
    getSessionUser,
  };
}

// Concluído = aceitou a versão atual do termo. Aceite de outra versão não libera o app.
export async function hasCompletedOnboarding(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: userOnboardings.userId })
    .from(userOnboardings)
    .where(
      and(eq(userOnboardings.userId, userId), eq(userOnboardings.consentVersion, CONSENT_VERSION)),
    )
    .limit(1);
  return rows.length > 0;
}

// Aceitou uma versão anterior do termo: a tela de aceite avisa que o termo mudou.
export async function hasOutdatedConsent(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: userOnboardings.userId })
    .from(userOnboardings)
    .where(
      and(eq(userOnboardings.userId, userId), ne(userOnboardings.consentVersion, CONSENT_VERSION)),
    )
    .limit(1);
  return rows.length > 0;
}

// Guard único de toda rota protegida e de toda Server Action.
export async function requireOnboardedUser(
  deps: GuardDeps = defaultDeps(),
): Promise<Result<SessionUser, "UNAUTHENTICATED" | "ONBOARDING_REQUIRED">> {
  const sessionUser = await deps.getSessionUser();
  if (!sessionUser) {
    return err("UNAUTHENTICATED");
  }
  if (!(await hasCompletedOnboarding(deps.db, sessionUser.id))) {
    return err("ONBOARDING_REQUIRED");
  }
  return ok(sessionUser);
}
