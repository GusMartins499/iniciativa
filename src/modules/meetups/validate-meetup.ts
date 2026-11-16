import { err, ok, type Result } from "@/shared/result";
import { fromAppTime } from "@/shared/time";
import { type MeetupInput, meetupInputSchema } from "./meetup-input";

export type ValidatedMeetup = {
  data: MeetupInput;
  startsAt: Date;
  endsAt: Date;
  occupiedSeats: number;
};

// Regras comuns a criar e editar: campos válidos, início no futuro, término depois
// do início e vagas suficientes para quem já ocupa o encontro.
export function validateMeetupFields(
  input: unknown,
  now: Date,
  occupiedSeatsFor: (data: MeetupInput) => number,
): Result<ValidatedMeetup, "VALIDATION_FAILED" | "CAPACITY_BELOW_OCCUPIED"> {
  const parsed = meetupInputSchema.safeParse(input);
  if (!parsed.success) {
    return err("VALIDATION_FAILED");
  }
  const data = parsed.data;
  const startsAt = fromAppTime(data.startsAt);
  const endsAt = fromAppTime(data.endsAt);
  if (endsAt <= startsAt || startsAt <= now) {
    return err("VALIDATION_FAILED");
  }
  const occupiedSeats = occupiedSeatsFor(data);
  if (data.capacity < occupiedSeats) {
    return err("CAPACITY_BELOW_OCCUPIED");
  }
  return ok({ data, startsAt, endsAt, occupiedSeats });
}
