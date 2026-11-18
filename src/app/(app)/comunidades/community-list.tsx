import Link from "next/link";
import { communitiesCopy as copy, type CommunitySummary } from "@/modules/communities/client";
import { meetupsCopy } from "@/modules/meetups/client";
import { MembershipButton, type MembershipButtonProps } from "./membership-button";

type Action = MembershipButtonProps["joinAction"];

// A contagem de encontros vem de meetups; a página junta as duas leituras.
export type CommunityCard = CommunitySummary & { upcomingCount: number };

export type CommunityListProps = {
  communities: CommunityCard[];
  joinActionFor: (slug: string) => Action;
  leaveActionFor: (slug: string) => Action;
};

// Só contagens: quem participa nunca chega à tela. Os encontros ficam para os membros,
// então o atalho "Ver encontros" só aparece para eles.
export function CommunityList({ communities, joinActionFor, leaveActionFor }: CommunityListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {communities.map((community) => (
        <li
          key={community.slug}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-bold">
              <Link
                href={`/comunidades/${community.slug}`}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                {community.name}
              </Link>
            </h2>
            <p>{copy.description(community.slug)}</p>
            <p className="text-sm text-muted-foreground">{copy.members(community.memberCount)}</p>
            <p className="text-sm text-muted-foreground">
              {meetupsCopy.community.upcomingCount(community.upcomingCount)}
            </p>
            {community.isMember ? <p className="font-semibold">{copy.memberNote}</p> : null}
            {community.isMember ? (
              <Link
                href={`/comunidades/${community.slug}`}
                className="inline-flex min-h-11 w-fit items-center font-semibold underline underline-offset-4"
              >
                {copy.seeMeetups}
              </Link>
            ) : null}
          </div>
          <div className="mt-auto">
            <MembershipButton
              name={community.name}
              isMember={community.isMember}
              joinAction={joinActionFor(community.slug)}
              leaveAction={leaveActionFor(community.slug)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
