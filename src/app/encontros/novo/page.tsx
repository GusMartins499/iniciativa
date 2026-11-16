import { meetupsCopy } from "@/modules/meetups";
import { requirePageUser } from "../../require-page-user";
import { createMeetupAction } from "./actions";
import { MeetupForm } from "./meetup-form";

export default async function NewMeetupPage() {
  await requirePageUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{meetupsCopy.form.title}</h1>
      <MeetupForm action={createMeetupAction} />
    </div>
  );
}
