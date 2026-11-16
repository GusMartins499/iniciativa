"use server";

import { revalidatePath } from "next/cache";
import { cancelRsvp, confirmRsvp } from "@/modules/rsvps";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { RsvpActionState } from "./rsvp-state";

async function run(
  meetupId: string,
  event: string,
  useCase: (
    userId: string,
  ) => Promise<{ ok: true } | { ok: false; error: { code: RsvpActionState["code"] } }>,
): Promise<RsvpActionState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    const result = await useCase(guard.data.id);
    if (!result.ok) return { code: result.error.code };
  } catch (error) {
    logger.error({ event, meetupId, err: error });
    return { code: "UNEXPECTED" };
  }
  revalidatePath(`/encontros/${meetupId}`);
  return { code: null };
}

// A entrada vem do cliente: o caso de uso valida de novo com Zod.
export async function confirmRsvpAction(
  meetupId: string,
  _state: RsvpActionState,
  input: unknown,
): Promise<RsvpActionState> {
  return run(meetupId, "rsvp.confirm_failed", (userId) =>
    confirmRsvp(getDb(), userId, meetupId, input),
  );
}

export async function cancelRsvpAction(
  meetupId: string,
  _state: RsvpActionState,
): Promise<RsvpActionState> {
  return run(meetupId, "rsvp.cancel_failed", (userId) => cancelRsvp(getDb(), userId, meetupId));
}
