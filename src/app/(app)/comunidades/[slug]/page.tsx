import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { communitiesCopy as copy, getCommunityBySlug } from "@/modules/communities";
import { countUpcomingByCommunity, listUpcomingByCommunity, meetupsCopy } from "@/modules/meetups";
import { getDb } from "@/shared/db";
import { MeetupDays } from "../../encontros/meetup-days";
import { requirePageUser } from "../../require-page-user";
import { joinCommunityAction, leaveCommunityAction } from "../actions";
import { MembershipButton } from "../membership-button";

type CommunityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CommunityPage({ params }: CommunityPageProps) {
  const currentUser = await requirePageUser();
  const { slug } = await params;
  const db = getDb();
  const result = await getCommunityBySlug(db, currentUser.id, slug);
  if (!result.ok) notFound();
  const community = result.data;
  // A contagem é pública; os encontros saem do banco só para quem participa.
  const [upcomingCount, meetups] = await Promise.all([
    countUpcomingByCommunity(db, community.slug),
    community.isMember ? listUpcomingByCommunity(db, community.slug) : null,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/comunidades"
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-[18px]" />
          {copy.backToList}
        </Link>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold tracking-tight">
          {community.name}
        </h1>
      </div>
      <section className="flex max-w-prose flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <p>{copy.description(community.slug)}</p>
        <p className="text-sm text-muted-foreground">{copy.members(community.memberCount)}</p>
        <p className="text-sm text-muted-foreground">
          {meetupsCopy.community.upcomingCount(upcomingCount)}
        </p>
        {community.isMember ? <p className="font-semibold">{copy.memberNote}</p> : null}
        <MembershipButton
          name={community.name}
          isMember={community.isMember}
          joinAction={joinCommunityAction.bind(null, community.slug)}
          leaveAction={leaveCommunityAction.bind(null, community.slug)}
        />
      </section>
      <section aria-labelledby="community-meetups" className="flex flex-col gap-4">
        <h2 id="community-meetups" className="text-xl font-bold">
          {meetupsCopy.community.listTitle}
        </h2>
        {meetups === null ? (
          <p className="text-muted-foreground">{meetupsCopy.community.membersOnly}</p>
        ) : meetups.length === 0 ? (
          <p className="text-muted-foreground">{meetupsCopy.community.emptyList}</p>
        ) : (
          <MeetupDays meetups={meetups} />
        )}
      </section>
    </div>
  );
}
