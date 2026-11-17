import { accountCopy as copy } from "@/modules/users";
import { Avatar } from "@/shared/ui";
import { requirePageUser } from "../require-page-user";
import { deleteAccountAction } from "./actions";
import { DeleteAccountPanel } from "./delete-account-panel";
import { SignOutButton } from "./sign-out-button";

// Quem está na conta em cima; as duas ações embaixo, separadas: sair (comum) antes de
// excluir (definitiva), cada uma explicando o que acontece.
export default async function AccountPage() {
  const currentUser = await requirePageUser();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>

      <section
        aria-label={currentUser.name}
        className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <Avatar name={currentUser.name} image={currentUser.image} className="size-16 text-2xl" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xl leading-snug font-bold">{currentUser.name}</p>
          <p className="break-words text-muted-foreground">
            {copy.googleAccount(currentUser.email)}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="sign-out-title"
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6"
      >
        <h2 id="sign-out-title" className="text-lg font-bold">
          {copy.signOutTitle}
        </h2>
        <p className="text-muted-foreground">{copy.signOutDescription}</p>
        <SignOutButton />
      </section>

      <DeleteAccountPanel action={deleteAccountAction} />
    </div>
  );
}
