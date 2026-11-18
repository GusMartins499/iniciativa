import { communitiesCopy as copy, listCommunities } from "@/modules/communities";
import { getDb } from "@/shared/db";
import { requirePageUser } from "../require-page-user";
import { joinCommunityAction, leaveCommunityAction } from "./actions";
import { CommunityList } from "./community-list";

export default async function CommunitiesPage() {
  const currentUser = await requirePageUser();
  const communities = await listCommunities(getDb(), currentUser.id);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[2rem] leading-tight font-bold tracking-tight">{copy.listTitle}</h1>
        <p className="mt-2 text-muted-foreground">{copy.listLead}</p>
      </div>
      <CommunityList
        communities={communities}
        joinActionFor={(slug) => joinCommunityAction.bind(null, slug)}
        leaveActionFor={(slug) => leaveCommunityAction.bind(null, slug)}
      />
    </div>
  );
}
