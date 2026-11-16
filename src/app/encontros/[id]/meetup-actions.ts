"use server";

import { revalidatePath } from "next/cache";
import { cancelMeetup } from "@/modules/meetups";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { MeetupFormState } from "../meetup-form-state";

export async function cancelMeetupAction(
  meetupId: string,
  _state: MeetupFormState,
): Promise<MeetupFormState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    // A autorização (só o criador) é conferida no caso de uso, com a linha travada.
    const result = await cancelMeetup(getDb(), guard.data.id, meetupId);
    if (!result.ok) return { code: result.error.code };
  } catch (error) {
    logger.error({ event: "meetup.cancel_failed", meetupId, err: error });
    return { code: "UNEXPECTED" };
  }
  revalidatePath(`/encontros/${meetupId}`);
  return { code: null };
}
