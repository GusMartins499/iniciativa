import { accountCopy as copy } from "@/modules/users";
import { requirePageUser } from "../require-page-user";
import { deleteAccountAction } from "./actions";
import { DeleteAccountPanel } from "./delete-account-panel";

export default async function AccountPage() {
  const currentUser = await requirePageUser();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p>{copy.signedInAs(currentUser.name)}</p>
      <DeleteAccountPanel action={deleteAccountAction} />
    </div>
  );
}
