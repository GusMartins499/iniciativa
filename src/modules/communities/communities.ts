import { and, count, eq } from "drizzle-orm";
import type { Database } from "@/shared/db";
import { logger } from "@/shared/logger";
import { err, ok, type Result } from "@/shared/result";
import { type Community, COMMUNITIES, type CommunitySlug, findCommunity } from "./list";
import { communityMemberships } from "./schema";

// Ninguém vê quem é membro (GUIDELINES § Domain criticality): a leitura devolve só
// a contagem e se a própria pessoa participa, nunca ids de outros usuários.
export type CommunitySummary = Community & { memberCount: number; isMember: boolean };

async function memberCounts(db: Database): Promise<Map<string, number>> {
  const rows = await db
    .select({ slug: communityMemberships.communitySlug, total: count() })
    .from(communityMemberships)
    .groupBy(communityMemberships.communitySlug);
  return new Map(rows.map((row) => [row.slug, row.total]));
}

export async function listMemberSlugs(db: Database, userId: string): Promise<CommunitySlug[]> {
  const rows = await db
    .select({ slug: communityMemberships.communitySlug })
    .from(communityMemberships)
    .where(eq(communityMemberships.userId, userId));
  const mine = new Set(rows.map((row) => row.slug));
  return COMMUNITIES.filter((community) => mine.has(community.slug)).map((c) => c.slug);
}

export async function listCommunities(db: Database, userId: string): Promise<CommunitySummary[]> {
  const [counts, mine] = await Promise.all([memberCounts(db), listMemberSlugs(db, userId)]);
  const memberOf = new Set<string>(mine);
  return COMMUNITIES.map((community) => ({
    slug: community.slug,
    name: community.name,
    memberCount: counts.get(community.slug) ?? 0,
    isMember: memberOf.has(community.slug),
  }));
}

export async function getCommunityBySlug(
  db: Database,
  userId: string,
  slug: string,
): Promise<Result<CommunitySummary, "NOT_FOUND">> {
  const community = findCommunity(slug);
  if (!community) return err("NOT_FOUND");
  const [[total], [membership]] = await Promise.all([
    db
      .select({ total: count() })
      .from(communityMemberships)
      .where(eq(communityMemberships.communitySlug, community.slug)),
    db
      .select({ userId: communityMemberships.userId })
      .from(communityMemberships)
      .where(
        and(
          eq(communityMemberships.communitySlug, community.slug),
          eq(communityMemberships.userId, userId),
        ),
      ),
  ]);
  return ok({
    slug: community.slug,
    name: community.name,
    memberCount: total?.total ?? 0,
    isMember: membership !== undefined,
  });
}

// Entrar de novo é idempotente: a chave primária (comunidade, usuário) impede duplicar.
export async function joinCommunity(
  db: Database,
  userId: string,
  slug: string,
): Promise<Result<void, "NOT_FOUND">> {
  const community = findCommunity(slug);
  if (!community) {
    logger.warn({ event: "community.join_rejected", userId, code: "NOT_FOUND" });
    return err("NOT_FOUND");
  }
  const inserted = await db
    .insert(communityMemberships)
    .values({ communitySlug: community.slug, userId })
    .onConflictDoNothing()
    .returning({ slug: communityMemberships.communitySlug });
  if (inserted.length > 0) {
    logger.info({ event: "community.joined", userId, communitySlug: community.slug });
  }
  return ok(undefined);
}

// Sair sem participar não muda nada.
export async function leaveCommunity(
  db: Database,
  userId: string,
  slug: string,
): Promise<Result<void, "NOT_FOUND">> {
  const community = findCommunity(slug);
  if (!community) {
    logger.warn({ event: "community.leave_rejected", userId, code: "NOT_FOUND" });
    return err("NOT_FOUND");
  }
  const removed = await db
    .delete(communityMemberships)
    .where(
      and(
        eq(communityMemberships.communitySlug, community.slug),
        eq(communityMemberships.userId, userId),
      ),
    )
    .returning({ slug: communityMemberships.communitySlug });
  if (removed.length > 0) {
    logger.info({ event: "community.left", userId, communitySlug: community.slug });
  }
  return ok(undefined);
}

// Exclusão de conta (orquestrada por users, na mesma transação). A FK em cascata já
// apagaria as linhas; a chamada explícita deixa a fronteira de módulos visível.
export async function removeAllMemberships(tx: Database, userId: string): Promise<number> {
  const removed = await tx
    .delete(communityMemberships)
    .where(eq(communityMemberships.userId, userId))
    .returning({ slug: communityMemberships.communitySlug });
  return removed.length;
}
