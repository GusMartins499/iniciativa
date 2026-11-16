import { MapPin } from "lucide-react";
import Link from "next/link";
import { meetupsCopy as copy, type PublicMeetup } from "@/modules/meetups/client";
import { formatHourRange } from "@/shared/time";
import { SeatsBar } from "./seats-bar";

export type MeetupCardProps = {
  meetup: PublicMeetup;
  going?: boolean;
  created?: boolean;
  // Em "Meus encontros" o aviso aparece por extenso: é por ali que a pessoa fica sabendo.
  longNotices?: boolean;
};

const tagBase = "rounded-full px-2.5 py-0.5 text-sm font-semibold";

// Só dados públicos e a ocupação; o card inteiro leva ao detalhe.
export function MeetupCard({
  meetup,
  going = false,
  created = false,
  longNotices = false,
}: MeetupCardProps) {
  const cancelled = meetup.status === "cancelled";
  const edited = meetup.editedAt !== null;
  const tags = [
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
    <Link
      href={`/encontros/${meetup.id}`}
      className="block rounded-xl border border-border bg-surface px-4 py-4 hover:border-slate-300 sm:px-5"
    >
      <p className="font-medium text-muted-foreground">
        {formatHourRange(meetup.startsAt, meetup.endsAt)}
      </p>
      <h3 className="mt-0.5 text-lg leading-snug font-bold">{meetup.title}</h3>
      {longNotices && (cancelled || edited) ? (
        <p
          className={`mt-2 rounded-md p-2.5 font-semibold ${
            cancelled ? "bg-honey-light text-honey-light-foreground" : "bg-tag text-tag-foreground"
          }`}
        >
          {cancelled ? copy.cancelledNotice : copy.editedNotice}
        </p>
      ) : null}
      <p className="mt-2 flex items-center gap-2 text-muted-foreground">
        <MapPin aria-hidden="true" className="size-[18px] shrink-0" />
        {meetup.address}
      </p>
      {cancelled ? null : (
        <div className="mt-3">
          <SeatsBar occupied={meetup.occupiedSeats} capacity={meetup.capacity} />
        </div>
      )}
      {tags.length > 0 ? (
        <p className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag.label} className={`${tagBase} ${tag.className}`}>
              {tag.label}
            </span>
          ))}
        </p>
      ) : null}
    </Link>
  );
}
