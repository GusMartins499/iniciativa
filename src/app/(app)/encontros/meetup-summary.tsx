import { meetupsCopy as copy, type PublicMeetup } from "@/modules/meetups";
import { formatAppDate, formatAppTime } from "@/shared/time";

// Ocupação e horário de um encontro, sem nenhum dado pessoal.
export function MeetupSummary({ meetup }: { meetup: PublicMeetup }) {
  return (
    <>
      <p>
        {copy.dateTime(
          formatAppDate(meetup.startsAt),
          formatAppTime(meetup.startsAt),
          formatAppTime(meetup.endsAt),
        )}
      </p>
      <p className="text-muted-foreground">{meetup.address}</p>
      <p>
        <span className="rounded bg-tag px-2 py-1 text-sm text-tag-foreground">
          {copy.occupancy(meetup.occupiedSeats, meetup.capacity)}
        </span>
        {meetup.isFull ? (
          <span className="ml-2 rounded bg-honey-light px-2 py-1 text-sm font-semibold text-honey-light-foreground">
            {copy.full}
          </span>
        ) : null}
      </p>
    </>
  );
}
