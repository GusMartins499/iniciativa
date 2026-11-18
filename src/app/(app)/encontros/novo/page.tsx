import { listMemberSlugs } from "@/modules/communities";
import { meetupsCopy } from "@/modules/meetups";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../../require-page-user";
import { audienceOptions } from "../audience";
import { MeetupForm } from "../meetup-form";
import { createMeetupAction } from "./actions";

export default async function NewMeetupPage() {
  const currentUser = await requirePageUser();
  const memberSlugs = await listMemberSlugs(getDb(), currentUser.id);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{meetupsCopy.form.title}</h1>
      <MeetupForm action={createMeetupAction} audiences={audienceOptions(memberSlugs)} />
    </div>
  );
}
