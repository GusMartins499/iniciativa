import { accountCopy, signInCopy as copy } from "@/modules/users";
import { SignInButton } from "./sign-in-button";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; deleted?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, deleted } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      {deleted ? <p className="font-semibold">{accountCopy.deleted}</p> : null}
      <p className="text-muted-foreground">{copy.intro}</p>
      {error ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.error}
        </p>
      ) : null}
      <SignInButton />
    </div>
  );
}
