import { meetupsCopy as copy } from "@/modules/meetups/client";

type MeetupNoticesProps = {
  status: "active" | "cancelled";
  edited: boolean;
};

// Sem e-mail nem push no MVP: é aqui que quem confirmou fica sabendo das mudanças.
export function MeetupNotices({ status, edited }: MeetupNoticesProps) {
  if (status === "cancelled") {
    return (
      <p className="rounded bg-honey-light p-3 font-semibold text-honey-light-foreground">
        {copy.cancelledNotice}
      </p>
    );
  }
  if (edited) {
    return (
      <p className="rounded bg-tag p-3 font-semibold text-tag-foreground">{copy.editedNotice}</p>
    );
  }
  return null;
}
