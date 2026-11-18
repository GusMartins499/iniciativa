import Link from "next/link";
import { notFound } from "next/navigation";
import { listMemberSlugs } from "@/modules/communities";
import {
  canSeeMeetup,
  getCreatorId,
  getMeetup,
  meetupsCopy as copy,
  OPEN_AUDIENCE,
} from "@/modules/meetups";
import { getUserRsvp } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { formatAppTime, toAppDateInput } from "@/shared/time";
import { audienceTag } from "../../audience";
import { MeetupForm } from "../../meetup-form";
import { requirePageUser } from "../../../require-page-user";
import { updateMeetupAction } from "./actions";

type EditMeetupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMeetupPage({ params }: EditMeetupPageProps) {
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
  if (!access.visible) notFound();
  const result = await getMeetup(db, id);

  let blocked: string | null = null;
  if (!result.ok) blocked = copy.notFound;
  else if ((await getCreatorId(db, id)) !== currentUser.id) blocked = copy.editNotAllowed;
  else if (result.data.status === "cancelled" || result.data.startsAt <= new Date()) {
    blocked = copy.editClosed;
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link href={`/encontros/${id}`} className="underline">
        {copy.back}
      </Link>
      <h1 className="text-2xl font-bold">{copy.editForm.title}</h1>
      {blocked || !result.ok ? (
        <p>{blocked}</p>
      ) : (
        <MeetupForm
          mode="edit"
          action={updateMeetupAction.bind(null, id)}
          // O público vai junto, só para leitura: o servidor recusa qualquer mudança.
          audiences={[
            {
              value: result.data.communitySlug ?? OPEN_AUDIENCE,
              label: audienceTag(result.data.communitySlug),
            },
          ]}
          defaultValues={{
            title: result.data.title,
            date: toAppDateInput(result.data.startsAt),
            startTime: formatAppTime(result.data.startsAt),
            endTime: formatAppTime(result.data.endsAt),
            address: result.data.address,
            placeDescription: result.data.placeDescription ?? "",
            capacity: result.data.capacity,
            publicPlace: true,
            audience: result.data.communitySlug ?? OPEN_AUDIENCE,
          }}
        />
      )}
    </div>
  );
}
