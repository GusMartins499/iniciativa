import Link from "next/link";
import { getMeetup, meetupsCopy as copy } from "@/modules/meetups";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../../require-page-user";
import { MeetupSummary } from "../meetup-summary";

type MeetupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetupPage({ params }: MeetupPageProps) {
  await requirePageUser();
  const { id } = await params;
  const result = await getMeetup(getDb(), id);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/encontros" className="underline">
        {copy.backToList}
      </Link>
      {result.ok ? (
        <article className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{result.data.title}</h1>
          <MeetupSummary meetup={result.data} />
          {result.data.placeDescription ? <p>{result.data.placeDescription}</p> : null}
        </article>
      ) : (
        <p>{copy.notFound}</p>
      )}
    </div>
  );
}
