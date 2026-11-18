import { CalendarDays, CircleCheck, Users } from "lucide-react";
import Link from "next/link";
import { communitiesCopy as copy, type CommunitySummary } from "@/modules/communities/client";
import { meetupsCopy } from "@/modules/meetups/client";
import { buttonVariants } from "@/shared/ui";
import { CommunityIcon } from "@/app/community-icon";
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
    // Com 2+ colunas, todas as linhas têm a altura da mais alta: os cards ficam iguais. No
    // celular (uma coluna) cada card tem a própria altura, sem vão vazio.
    <ul className="grid gap-4 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <li
          key={community.slug}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2">
              <h2 className="flex items-center gap-3 text-[17px] font-bold">
                <CommunityIcon slug={community.slug} size="md" />
                <Link
                  href={`/comunidades/${community.slug}`}
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {community.name}
                </Link>
              </h2>
              {community.isMember ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-honey-light px-2.5 py-0.5 text-sm font-semibold text-honey-light-foreground">
                  <CircleCheck aria-hidden="true" className="size-4" />
                  {copy.memberBadge}
                </span>
              ) : null}
            </div>
            <p>{copy.description(community.slug)}</p>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-4 shrink-0" />
              {copy.members(community.memberCount)}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
              {meetupsCopy.community.upcomingCount(community.upcomingCount)}
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            {community.isMember ? (
              <Link
                href={`/comunidades/${community.slug}`}
                className={buttonVariants({ variant: "primary" })}
              >
                {copy.seeMeetups}
              </Link>
            ) : null}
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
