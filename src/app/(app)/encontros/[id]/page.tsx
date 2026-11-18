import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listComments } from "@/modules/comments";
import { listMemberSlugs } from "@/modules/communities";
import { canSeeMeetup, getCreatorId, getMeetup, meetupsCopy } from "@/modules/meetups";
import { getUserRsvp, listAttendeesForCreator } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { CommunityIcon, communityStyle } from "../../community-icon";
import { communityTheme } from "../../community-theme";
import { requirePageUser } from "../../require-page-user";
import { audienceTag } from "../audience";
import { SeatsBar } from "../seats-bar";
import { cancelRsvpAction, confirmRsvpAction } from "./actions";
import { AttendeeList } from "./attendee-list";
import { createCommentAction, deleteCommentAction, refreshCommentsAction } from "./comment-actions";
import { CommentsSection } from "./comments-section";
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
  const [memberSlugs, rsvp] = await Promise.all([
    listMemberSlugs(db, currentUser.id),
    getUserRsvp(db, currentUser.id, id),
  ]);
  const access = await canSeeMeetup(db, id, {
    userId: currentUser.id,
    memberSlugs,
    hasRsvp: rsvp !== null,
  });
  // Encontro de comunidade alheia e encontro inexistente dão o mesmo 404.
  if (!access.visible) notFound();
  const result = await getMeetup(db, id);
  if (!result.ok) notFound();

  const backLink = (
    <Link
      href="/encontros"
      className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-[18px]" />
      {meetupsCopy.backToList}
    </Link>
  );
  const meetup = result.data;
  const theme = communityTheme(meetup.communitySlug);
  const isCreator = (await getCreatorId(db, id)) === currentUser.id;
  // Os nomes só são lidos depois de o servidor conferir que quem pede é o criador.
  const attendees = isCreator ? await listAttendeesForCreator(db, currentUser.id, id) : null;
  const comments = await listComments(db, id, currentUser.id);

  const started = meetup.startsAt <= new Date();
  const active = meetup.status === "active";
  let status: RsvpStatus;
  if (isCreator) status = { kind: "creator" };
  else if (started) status = { kind: "started" };
  else if (rsvp) status = { kind: "confirmed", withCompanion: rsvp.withCompanion };
  else status = { kind: "open", full: meetup.isFull };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        {backLink}
        {/* Fora da lista filtrada, a página é o único lugar que diz de qual comunidade é o
            encontro. */}
        {theme && meetup.communitySlug ? (
          <p
            style={communityStyle(theme)}
            className="mt-2 flex w-fit items-center gap-2 rounded-full bg-(--community-bg) py-1 pr-3 pl-1 font-semibold text-(--community-fg)"
          >
            <CommunityIcon slug={meetup.communitySlug} />
            {audienceTag(meetup.communitySlug)}
          </p>
        ) : null}
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
          {attendees?.ok ? <AttendeeList attendees={attendees.data} /> : null}
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
      {comments.ok ? (
        <CommentsSection
          {...comments.data}
          createAction={createCommentAction.bind(null, id)}
          deleteAction={deleteCommentAction.bind(null, id)}
          refreshAction={refreshCommentsAction.bind(null, id)}
        />
      ) : null}
    </div>
  );
}
