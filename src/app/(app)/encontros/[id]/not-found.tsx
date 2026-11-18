import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { meetupsCopy } from "@/modules/meetups";

// Encontro inexistente e encontro de comunidade da qual a pessoa não participa.
export default function MeetupNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/encontros"
        className="inline-flex min-h-11 items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-[18px]" />
        {meetupsCopy.backToList}
      </Link>
      <p>{meetupsCopy.notFound}</p>
    </div>
  );
}
