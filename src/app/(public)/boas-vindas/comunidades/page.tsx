import { redirect } from "next/navigation";
import { COMMUNITIES, communitiesCopy } from "@/modules/communities";
import { requireOnboardedUser } from "@/modules/users";
import { joinCommunitiesAction } from "./actions";
import { CommunityPicker } from "./community-picker";

const copy = communitiesCopy.onboarding;

// Passo depois do aceite, para a conta nova. Voltar aqui depois é inofensivo: entrar de
// novo numa comunidade não duplica a participação.
export default async function ChooseCommunitiesPage() {
  const guard = await requireOnboardedUser();
  if (!guard.ok) {
    redirect(guard.error.code === "UNAUTHENTICATED" ? "/" : "/boas-vindas");
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-muted-foreground">{copy.lead}</p>
      </div>
      <CommunityPicker communities={COMMUNITIES} action={joinCommunitiesAction} />
    </div>
  );
}
