import Link from "next/link";
import type { PublicMeetup } from "@/modules/meetups/client";
import { MeetupNotices } from "../encontros/[id]/meetup-notices";
import { MeetupSummary } from "../encontros/meetup-summary";
import { myMeetupsCopy as copy } from "./copy";
import type { MyMeetups } from "./load-my-meetups";

function MeetupList({ meetups, empty }: { meetups: PublicMeetup[]; empty: string }) {
  if (meetups.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {meetups.map((meetup) => (
        <li
          key={meetup.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"
        >
          <h3 className="text-lg font-bold">
            <Link href={`/encontros/${meetup.id}`} className="underline">
              {meetup.title}
            </Link>
          </h3>
          <MeetupNotices status={meetup.status} edited={meetup.editedAt !== null} />
          <MeetupSummary meetup={meetup} />
        </li>
      ))}
    </ul>
  );
}

// Só dados públicos e ocupação: os nomes dos confirmados ficam no detalhe, para o criador.
export function MyMeetupsView({ created, confirmed }: MyMeetups) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="created-title" className="flex flex-col gap-3">
        <h2 id="created-title" className="text-xl font-bold">
          {copy.createdTitle}
        </h2>
        <MeetupList meetups={created} empty={copy.createdEmpty} />
      </section>
      <section aria-labelledby="confirmed-title" className="flex flex-col gap-3">
        <h2 id="confirmed-title" className="text-xl font-bold">
          {copy.confirmedTitle}
        </h2>
        <MeetupList meetups={confirmed} empty={copy.confirmedEmpty} />
      </section>
    </div>
  );
}
