import { listByCreator, listUpcoming, meetupsCopy as copy } from "@/modules/meetups";
import { listMeetupIdsByUser } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../require-page-user";
import { MeetupDays } from "./meetup-days";

export default async function MeetupsPage() {
  const currentUser = await requirePageUser();
  const db = getDb();
  const [result, goingIds, created] = await Promise.all([
    listUpcoming(db),
    listMeetupIdsByUser(db, currentUser.id),
    listByCreator(db, currentUser.id),
  ]);
  const meetups = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[2rem] leading-tight font-bold tracking-tight">{copy.listTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.listLead}</p>
      </div>
      {meetups.length === 0 ? (
        <p className="text-muted-foreground">{copy.emptyList}</p>
      ) : (
        <MeetupDays
          meetups={meetups}
          goingIds={new Set(goingIds)}
          createdIds={new Set(created.map((meetup) => meetup.id))}
        />
      )}
    </div>
  );
}
