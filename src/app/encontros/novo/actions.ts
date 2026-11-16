"use server";

import { redirect } from "next/navigation";
import { createMeetup } from "@/modules/meetups";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { CreateMeetupState } from "./state";

export async function createMeetupAction(
  _state: CreateMeetupState,
  input: unknown,
): Promise<CreateMeetupState> {
  let meetupId: string;
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) {
      return { code: guard.error.code };
    }
    // A entrada vem do cliente: o caso de uso valida de novo com Zod.
    const result = await createMeetup(getDb(), guard.data.id, input);
    if (!result.ok) {
      return { code: result.error.code };
    }
    meetupId = result.data.id;
  } catch (error) {
    logger.error({ event: "meetup.create_failed", err: error });
    return { code: "UNEXPECTED" };
  }
  // redirect() lança internamente; fica fora do try para não ser tratado como falha.
  redirect(`/encontros/${meetupId}`);
}
