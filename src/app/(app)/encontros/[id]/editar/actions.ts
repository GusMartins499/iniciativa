"use server";

import { redirect } from "next/navigation";
import { updateMeetup } from "@/modules/meetups";
import { requireOnboardedUser } from "@/modules/users";
import { getDb } from "@/shared/db";
import { logger } from "@/shared/logger";
import type { MeetupFormState } from "../../meetup-form-state";

export async function updateMeetupAction(
  meetupId: string,
  _state: MeetupFormState,
  input: unknown,
): Promise<MeetupFormState> {
  try {
    const guard = await requireOnboardedUser();
    if (!guard.ok) return { code: guard.error.code };
    // A entrada vem do cliente: o caso de uso valida de novo com Zod e confere o criador.
    const result = await updateMeetup(getDb(), guard.data.id, meetupId, input);
    if (!result.ok) return { code: result.error.code };
  } catch (error) {
    logger.error({ event: "meetup.update_failed", meetupId, err: error });
    return { code: "UNEXPECTED" };
  }
  // redirect() lança internamente; fica fora do try para não ser tratado como falha.
  redirect(`/encontros/${meetupId}`);
}
