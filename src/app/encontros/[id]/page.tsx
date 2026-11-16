import Link from "next/link";
import { getCreatorId, getMeetup, meetupsCopy } from "@/modules/meetups";
import { getUserRsvp, listAttendeesForCreator, rsvpsCopy } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../../require-page-user";
import { MeetupSummary } from "../meetup-summary";
import { cancelRsvpAction, confirmRsvpAction } from "./actions";
import { CreatorActions } from "./creator-actions";
import { cancelMeetupAction } from "./meetup-actions";
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
    <Link href="/encontros" className="underline">
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
      {backLink}
      <article className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">{meetup.title}</h1>
        <MeetupSummary meetup={meetup} />
        {meetup.placeDescription ? <p>{meetup.placeDescription}</p> : null}
      </article>
      <MeetupNotices status={meetup.status} edited={meetup.editedAt !== null} />
      {active ? (
        <RsvpPanel
          status={status}
          confirmAction={confirmRsvpAction.bind(null, id)}
          cancelAction={cancelRsvpAction.bind(null, id)}
        />
      ) : null}
      {isCreator && active && !started ? (
        <CreatorActions meetupId={id} cancelMeetupAction={cancelMeetupAction.bind(null, id)} />
      ) : null}
      {attendees?.ok ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{rsvpsCopy.attendeesTitle}</h2>
          {attendees.data.length === 0 ? (
            <p className="text-muted-foreground">{rsvpsCopy.attendeesEmpty}</p>
          ) : (
            <ul className="list-disc pl-5">
              {attendees.data.map((attendee, index) => (
                <li key={`${attendee.firstName}-${index}`}>
                  {rsvpsCopy.attendee(attendee.firstName, attendee.withCompanion)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
