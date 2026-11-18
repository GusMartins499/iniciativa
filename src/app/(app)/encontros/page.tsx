import Link from "next/link";
import { listMemberSlugs } from "@/modules/communities";
import { listByCreator, listUpcoming, meetupsCopy as copy } from "@/modules/meetups";
import { listMeetupIdsByUser } from "@/modules/rsvps";
import { getDb } from "@/shared/db";
import { annotateActiveSpan } from "@/shared/observability";
import { requirePageUser } from "../require-page-user";
import { audienceFilterOptions, parseAudienceFilter } from "./audience";
import { AudienceFilterNav } from "./audience-filter-nav";
import { MeetupDays } from "./meetup-days";

type MeetupsPageProps = {
  searchParams: Promise<{ publico?: string | string[] }>;
};

export default async function MeetupsPage({ searchParams }: MeetupsPageProps) {
  const currentUser = await requirePageUser();
  const db = getDb();
  const [memberSlugs, { publico }] = await Promise.all([
    listMemberSlugs(db, currentUser.id),
    searchParams,
  ]);
  const filter = parseAudienceFilter(publico, memberSlugs);
  const filterOptions = audienceFilterOptions(memberSlugs);
  annotateActiveSpan({ audienceFilter: filter });
  const [result, goingIds, created] = await Promise.all([
    listUpcoming(db, memberSlugs, filter),
    listMeetupIdsByUser(db, currentUser.id),
    listByCreator(db, currentUser.id),
  ]);
  const meetups = result.ok ? result.data : [];
  const filterLabel = filterOptions.find((option) => option.filter === filter)?.label ?? filter;
  const filteredEmpty =
    filter === "open" ? copy.filter.emptyOpen : copy.filter.emptyCommunity(filterLabel);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {memberSlugs.length === 0 ? (
        <p className="rounded-xl bg-honey-light p-4 font-semibold text-honey-light-foreground">
          {copy.noCommunitiesBanner}{" "}
          <Link href="/comunidades" className="underline">
            {copy.noCommunitiesLink}
          </Link>
        </p>
      ) : null}
      <div>
        <h1 className="text-[2rem] leading-tight font-bold tracking-tight">{copy.listTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.listLead}</p>
      </div>
      <AudienceFilterNav options={filterOptions} current={filter} />
      {meetups.length === 0 && filter === "all" ? (
        <p className="text-muted-foreground">{copy.emptyList}</p>
      ) : meetups.length === 0 ? (
        <p className="text-muted-foreground">
          {filteredEmpty}{" "}
          <Link href="/encontros" className="font-semibold text-foreground underline">
            {copy.filter.showAll}
          </Link>
        </p>
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
