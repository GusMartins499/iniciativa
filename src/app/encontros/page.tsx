import Link from "next/link";
import { listUpcoming, meetupsCopy as copy } from "@/modules/meetups";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../require-page-user";
import { MeetupSummary } from "./meetup-summary";

export default async function MeetupsPage() {
  await requirePageUser();
  const result = await listUpcoming(getDb());
  const meetups = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{copy.listTitle}</h1>
        <Link
          href="/encontros/novo"
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {copy.newMeetupLink}
        </Link>
      </div>
      {meetups.length === 0 ? (
        <p className="text-muted-foreground">{copy.emptyList}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {meetups.map((meetup) => (
            <li key={meetup.id} className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-lg font-bold">
                <Link href={`/encontros/${meetup.id}`} className="underline">
                  {meetup.title}
                </Link>
              </h2>
              <MeetupSummary meetup={meetup} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
