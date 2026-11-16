import { signInCopy as copy } from "@/modules/users";
import { SignInButton } from "./sign-in-button";

type SignInPageProps = {
  searchParams: Promise<{ erro?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { erro } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{copy.title}</h1>
      <p className="text-muted-foreground">{copy.intro}</p>
      {erro ? (
        <p role="alert" className="font-semibold text-honey-light-foreground">
          {copy.error}
        </p>
      ) : null}
      <SignInButton copy={copy} />
    </div>
  );
}
