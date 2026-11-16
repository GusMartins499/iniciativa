import { redirect } from "next/navigation";
import { requirePageUser } from "./require-page-user";

export default async function HomePage() {
  await requirePageUser();
  redirect("/encontros");
}
