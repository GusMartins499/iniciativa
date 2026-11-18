import { timingSafeEqual } from "node:crypto";
import { purgeExpiredComments } from "@/modules/comments";
import { getDb } from "@/shared/db";
import { getServerEnv } from "@/shared/env";
import { logger } from "@/shared/logger";
import { reportError } from "@/shared/observability";

// Tempo constante: a resposta não pode revelar quantos caracteres do segredo bateram.
function isAuthorized(header: string | null, secret: string): boolean {
  if (header === null) return false;
  const received = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

// Job diário da Vercel (vercel.json): apaga os comentários dos encontros que terminaram
// há mais de 30 dias. O `comment.purge.completed` alimenta o alerta de "não rodou".
export async function GET(request: Request): Promise<Response> {
  try {
    if (!isAuthorized(request.headers.get("authorization"), getServerEnv().CRON_SECRET)) {
      logger.warn({ event: "comment.purge_unauthorized" });
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    const count = await purgeExpiredComments(getDb());
    if (count > 0) logger.info({ event: "comment.purged", count });
    logger.info({ event: "comment.purge.completed", count });
    return Response.json({ count });
  } catch (error) {
    reportError(error, { event: "comment.purge_failed" });
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
