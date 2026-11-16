import { eq } from "drizzle-orm";
import { getSessionUser, type SessionUser } from "@/shared/auth";
import { type Database, getDb } from "@/shared/db";
import { err, ok, type Result } from "@/shared/result";
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

export async function hasCompletedOnboarding(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: userOnboardings.userId })
    .from(userOnboardings)
    .where(eq(userOnboardings.userId, userId))
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
