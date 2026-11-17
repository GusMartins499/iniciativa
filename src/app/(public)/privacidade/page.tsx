import Link from "next/link";
import { privacyCopy as copy } from "@/modules/users";

// Pública e sem banco: a pessoa lê o termo completo antes de ter conta.
export default function PrivacyPage() {
  return (
    <article className="flex max-w-prose flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.version}</p>
      </header>
      {copy.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.items ? (
            <ul className="flex list-disc flex-col gap-1 pl-6">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.after?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}
      <Link href="/" className="inline-flex min-h-11 w-fit items-center font-semibold underline">
        {copy.back}
      </Link>
    </article>
  );
}
