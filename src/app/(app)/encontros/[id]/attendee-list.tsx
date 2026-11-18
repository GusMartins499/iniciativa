import { type CreatorAttendee, rsvpsCopy } from "@/modules/rsvps/client";
import { Avatar } from "@/shared/ui";

type AttendeeListProps = {
  attendees: CreatorAttendee[];
};

// Só o criador recebe esta lista: quem decide é o listAttendeesForCreator, no servidor.
export function AttendeeList({ attendees }: AttendeeListProps) {
  return (
    <section
      aria-labelledby="attendees-title"
      className="flex flex-col gap-2 border-t border-border pt-4"
    >
      <h3 id="attendees-title" className="font-bold">
        {rsvpsCopy.attendeesTitle}
      </h3>
      <p className="text-sm text-muted-foreground">{rsvpsCopy.attendeesHint}</p>
      {attendees.length === 0 ? (
        <p className="text-muted-foreground">{rsvpsCopy.attendeesEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attendees.map((attendee, index) => (
            <li key={`${attendee.firstName}-${index}`} className="flex items-center gap-2.5">
              <Avatar
                name={attendee.firstName}
                image={attendee.image}
                size={32}
                className="size-8 text-sm"
              />
              {rsvpsCopy.attendee(attendee.firstName, attendee.withCompanion)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
