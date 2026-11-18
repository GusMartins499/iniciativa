import { ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { meetupsCopy as copy, type PublicMeetup } from "@/modules/meetups/client";
import { formatHourRange } from "@/shared/time";
import { audienceTag } from "./audience";
import { SeatsBar } from "./seats-bar";

export type MeetupCardProps = {
  meetup: PublicMeetup;
  going?: boolean;
  created?: boolean;
  // Em "Meus encontros" o aviso aparece por extenso: é por ali que a pessoa fica sabendo.
  longNotices?: boolean;
  // Comunidades de quem vê: a etiqueta da comunidade vira link para a página dela.
  memberSlugs?: ReadonlySet<string>;
};

const tagBase = "rounded-full px-2.5 py-0.5 text-sm font-semibold";

// Só dados públicos e a ocupação. O card inteiro leva ao detalhe por um link esticado no
// título (link dentro de link não vale em HTML); a etiqueta da comunidade fica por cima dele.
export function MeetupCard({
  meetup,
  going = false,
  created = false,
  longNotices = false,
  memberSlugs,
}: MeetupCardProps) {
  const cancelled = meetup.status === "cancelled";
  const edited = meetup.editedAt !== null;
  const communityHref =
    meetup.communitySlug !== null && memberSlugs?.has(meetup.communitySlug)
      ? `/comunidades/${meetup.communitySlug}`
      : null;
  const tags: { label: string; className: string; href?: string }[] = [
    {
      label: audienceTag(meetup.communitySlug),
      className: "bg-tag text-tag-foreground",
      href: communityHref ?? undefined,
    },
    created ? { label: copy.tags.created, className: "bg-primary text-primary-foreground" } : null,
    going && !created
      ? { label: copy.tags.going, className: "bg-primary text-primary-foreground" }
      : null,
    cancelled && !longNotices
      ? { label: copy.tags.cancelled, className: "bg-honey-light text-honey-light-foreground" }
      : null,
    !cancelled && meetup.isFull
      ? { label: copy.tags.full, className: "bg-honey-light text-honey-light-foreground" }
      : null,
    !cancelled && edited && !longNotices
      ? { label: copy.tags.edited, className: "bg-tag text-tag-foreground" }
      : null,
  ].filter((tag) => tag !== null);

  return (
    <div className="group relative rounded-2xl border border-border bg-surface p-4 shadow-sm hover:border-border-strong hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-honey-light px-2.5 py-0.5 text-sm font-semibold text-honey-light-foreground">
          <Clock aria-hidden="true" className="size-4" />
          {formatHourRange(meetup.startsAt, meetup.endsAt)}
        </p>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground"
        />
      </div>
      <h3 className="mt-2.5 text-xl leading-snug font-bold tracking-tight">
        <Link
          href={`/encontros/${meetup.id}`}
          className="after:absolute after:inset-0 after:rounded-2xl"
        >
          {meetup.title}
        </Link>
      </h3>
      {longNotices && (cancelled || edited) ? (
        <p
          className={`mt-2 rounded-md p-2.5 font-semibold ${
            cancelled ? "bg-honey-light text-honey-light-foreground" : "bg-tag text-tag-foreground"
          }`}
        >
          {cancelled ? copy.cancelledNotice : copy.editedNotice}
        </p>
      ) : null}
      <p className="mt-1.5 flex items-start gap-2 text-muted-foreground">
        <MapPin aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
        {meetup.address}
      </p>
      {cancelled ? null : (
        <div className="mt-4 border-t border-border pt-4">
          <SeatsBar occupied={meetup.occupiedSeats} capacity={meetup.capacity} />
        </div>
      )}
      {tags.length > 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((tag) =>
            tag.href ? (
              <Link
                key={tag.label}
                href={tag.href}
                className="relative z-10 inline-flex min-h-11 items-center underline underline-offset-4"
              >
                <span className={`${tagBase} ${tag.className}`}>{tag.label}</span>
              </Link>
            ) : (
              <span key={tag.label} className={`${tagBase} ${tag.className}`}>
                {tag.label}
              </span>
            ),
          )}
        </p>
      ) : null}
    </div>
  );
}
