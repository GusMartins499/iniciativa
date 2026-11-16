import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getCreatorId, getMeetup, meetupsCopy } from "@/modules/meetups";
import { getUserRsvp, listAttendeesForCreator, rsvpsCopy } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../../require-page-user";
import { SeatsBar } from "../seats-bar";
import { cancelRsvpAction, confirmRsvpAction } from "./actions";
import { CreatorActions } from "./creator-actions";
import { cancelMeetupAction } from "./meetup-actions";
import { MeetupFacts } from "./meetup-facts";
import { MeetupNotices } from "./meetup-notices";
import { RsvpPanel } from "./rsvp-panel";
import type { RsvpStatus } from "./rsvp-state";

type MeetupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetupPage({ params }: MeetupPageProps) {
  const currentUser = await requirePageUser();
  const { id } = await params;
  const db = getDb();
  const result = await getMeetup(db, id);

  const backLink = (
    <Link
      href="/encontros"
      className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-[18px]" />
      {meetupsCopy.backToList}
    </Link>
  );
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <p>{meetupsCopy.notFound}</p>
      </div>
    );
  }

  const meetup = result.data;
  const isCreator = (await getCreatorId(db, id)) === currentUser.id;
  const rsvp = isCreator ? null : await getUserRsvp(db, currentUser.id, id);
  // Os nomes só são lidos depois de o servidor conferir que quem pede é o criador.
  const attendees = isCreator ? await listAttendeesForCreator(db, currentUser.id, id) : null;

  const started = meetup.startsAt <= new Date();
  const active = meetup.status === "active";
  let status: RsvpStatus;
  if (isCreator) status = { kind: "creator" };
  else if (started) status = { kind: "started" };
  else if (rsvp) status = { kind: "confirmed", withCompanion: rsvp.withCompanion };
  else status = { kind: "open", full: meetup.isFull };

  return (
    <div className="flex flex-col gap-4">
      <div>
        {backLink}
        <h1 className="mt-1 text-[2rem] leading-tight font-bold tracking-tight">{meetup.title}</h1>
      </div>
      <MeetupNotices status={meetup.status} edited={meetup.editedAt !== null} />
      <div className="grid items-start gap-6 md:grid-cols-[1fr_18.75rem]">
        <MeetupFacts meetup={meetup} />
        <aside
          aria-labelledby="presence-title"
          className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5 md:sticky md:top-4"
        >
          <h2 id="presence-title" className="text-[17px] font-bold">
            {meetupsCopy.presenceTitle}
          </h2>
          {active ? <SeatsBar occupied={meetup.occupiedSeats} capacity={meetup.capacity} /> : null}
          {active ? (
            <RsvpPanel
              status={status}
              confirmAction={confirmRsvpAction.bind(null, id)}
              cancelAction={cancelRsvpAction.bind(null, id)}
            />
          ) : null}
          {attendees?.ok ? (
            <section
              aria-labelledby="attendees-title"
              className="flex flex-col gap-2 border-t border-border pt-4"
            >
              <h3 id="attendees-title" className="font-bold">
                {rsvpsCopy.attendeesTitle}
              </h3>
              <p className="text-sm text-muted-foreground">{rsvpsCopy.attendeesHint}</p>
              {attendees.data.length === 0 ? (
                <p className="text-muted-foreground">{rsvpsCopy.attendeesEmpty}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {attendees.data.map((attendee, index) => (
                    <li
                      key={`${attendee.firstName}-${index}`}
                      className="flex items-center gap-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 place-items-center rounded-full bg-tag text-sm font-bold text-tag-foreground"
                      >
                        {attendee.firstName.charAt(0).toUpperCase()}
                      </span>
                      {rsvpsCopy.attendee(attendee.firstName, attendee.withCompanion)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          {isCreator && active && !started ? (
            <section
              aria-labelledby="manage-title"
              className="flex flex-col gap-3 border-t border-border pt-4"
            >
              <h3 id="manage-title" className="font-bold">
                {meetupsCopy.manageTitle}
              </h3>
              <CreatorActions
                meetupId={id}
                cancelMeetupAction={cancelMeetupAction.bind(null, id)}
              />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
