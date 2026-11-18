import { ArrowLeft, CircleCheck } from "lucide-react";
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
    <div className="flex flex-col gap-6">
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
        <p className="mt-2 max-w-prose text-muted-foreground">{copy.description(community.slug)}</p>
      </div>
      {/* Os encontros são o que a pessoa veio ver: ficam no centro e primeiro. A ação e os
          números vão para a lateral (e, no celular, para depois da lista). */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 lg:items-start">
        <section aria-labelledby="community-meetups" className="flex flex-col gap-4">
          <h2 id="community-meetups" className="text-xl font-bold">
            {meetupsCopy.community.listTitle}
          </h2>
          {meetups === null ? (
            <p className="rounded-2xl border border-border bg-surface p-4 text-muted-foreground">
              {meetupsCopy.community.membersOnly}
            </p>
          ) : meetups.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface p-4 text-muted-foreground">
              {meetupsCopy.community.emptyList}
            </p>
          ) : (
            <MeetupDays meetups={meetups} />
          )}
        </section>
        <aside aria-labelledby="community-about" className="flex flex-col gap-3 lg:sticky lg:top-6">
          <h2 id="community-about" className="sr-only">
            {copy.aboutTitle}
          </h2>
          {/* A ação principal fica solta, sem cartão em volta: é o primeiro alvo da lateral. */}
          <div className="flex flex-col gap-2">
            {community.isMember ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <CircleCheck aria-hidden="true" className="size-[18px] text-honey-hover" />
                {copy.memberNote}
              </p>
            ) : null}
            <MembershipButton
              name={community.name}
              isMember={community.isMember}
              joinAction={joinCommunityAction.bind(null, community.slug)}
              leaveAction={leaveCommunityAction.bind(null, community.slug)}
            />
          </div>
          {/* Só contagens, nunca quem participa. Cada linha é a frase inteira ("4 pessoas
              participam"), com o número em destaque. */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            {[
              { key: "members", count: community.memberCount, label: copy.stats.members },
              { key: "upcoming", count: upcomingCount, label: copy.stats.upcoming },
            ].map((stat) => (
              <p key={stat.key} className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-foreground tabular-nums">{stat.count}</span>{" "}
                <span className="text-muted-foreground">{stat.label(stat.count)}</span>
              </p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
