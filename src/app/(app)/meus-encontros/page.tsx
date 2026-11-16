import { getDb } from "@/shared/db";
import { requirePageUser } from "../require-page-user";
import { myMeetupsCopy as copy } from "./copy";
import { loadMyMeetups } from "./load-my-meetups";
import { MyMeetupsView } from "./my-meetups-view";

export default async function MyMeetupsPage() {
  const currentUser = await requirePageUser();
  const myMeetups = await loadMyMeetups(getDb(), currentUser.id);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[2rem] leading-tight font-bold tracking-tight">{copy.title}</h1>
      <MyMeetupsView created={myMeetups.created} confirmed={myMeetups.confirmed} />
    </div>
  );
}
