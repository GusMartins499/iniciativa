import type { PublicMeetup } from "@/modules/meetups/client";
import { MeetupCard } from "../encontros/meetup-card";
import { myMeetupsCopy as copy } from "./copy";
import type { MyMeetups } from "./load-my-meetups";

type MeetupListProps = {
  meetups: PublicMeetup[];
  empty: string;
  relation: "created" | "going";
};

function MeetupList({ meetups, empty, relation }: MeetupListProps) {
  if (meetups.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {meetups.map((meetup) => (
        <li key={meetup.id}>
          <MeetupCard
            meetup={meetup}
            created={relation === "created"}
            going={relation === "going"}
            longNotices
          />
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
        <MeetupList meetups={created} empty={copy.createdEmpty} relation="created" />
      </section>
      <section aria-labelledby="confirmed-title" className="flex flex-col gap-3">
        <h2 id="confirmed-title" className="text-xl font-bold">
          {copy.confirmedTitle}
        </h2>
        <MeetupList meetups={confirmed} empty={copy.confirmedEmpty} relation="going" />
      </section>
    </div>
  );
}
