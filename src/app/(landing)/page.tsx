import Link from "next/link";
import { redirect } from "next/navigation";
import { COMMUNITIES } from "@/modules/communities/client";
import { hasCompletedOnboarding } from "@/modules/users";
import { accountCopy, signInCopy } from "@/modules/users/client";
import { getSessionUser } from "@/shared/auth";
import { getDb } from "@/shared/db";
import { NumberHexagon } from "@/shared/ui";
import { landingCopy as copy } from "./copy";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; deleted?: string }>;
};

const container = "mx-auto w-full max-w-6xl px-4";

// Polígono regular com ponta para cima, centrado em (cx, cy): o hexágono e a face do logo.
function polygon(cx: number, cy: number, r: number, angles: number[]): string {
  return angles
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
    })
    .join(" ");
}

const hexagon = (cx: number, cy: number, r: number) =>
  polygon(cx, cy, r, [-90, -30, 30, 90, 150, 210]);
const triangle = (cx: number, cy: number, r: number) => polygon(cx, cy, r, [-90, 30, 150]);

// Textura do hero: contornos do hexágono da marca, grandes e cortados na borda direita, com a
// face do d20 (o triângulo do logo) no centro.
// Só decoração (aria-hidden), em mel com pouca opacidade para não competir com o texto.
function HeroTexture() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 600 700"
      className="pointer-events-none absolute top-1/2 right-0 hidden h-[115%] -translate-y-1/2 translate-x-1/4 xl:block"
    >
      <g fill="none" stroke="var(--color-honey)" strokeWidth={2} strokeLinejoin="round">
        <polygon points={hexagon(300, 350, 260)} opacity={0.35} />
        <polygon points={hexagon(300, 350, 190)} opacity={0.22} />
        <polygon points={hexagon(300, 350, 120)} opacity={0.14} />
      </g>
      <polygon points={triangle(300, 350, 52)} fill="var(--color-honey)" />
    </svg>
  );
}

// Tela inicial do visitante: o que é o iniciativa e a entrada como ação principal.
// "Entrar com Google" aqui só leva aos termos; quem fala com o Google (e cria a conta)
// é o "Confirmar e entrar" de /boas-vindas, depois do aceite.
export default async function LandingPage({ searchParams }: SignInPageProps) {
  const { error, deleted } = await searchParams;
  // "/" é a tela do visitante. Quem já entrou vai para o app; quem entrou sem concluir
  // a autodeclaração (conta anterior a esta regra) vai para os termos.
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    redirect(
      (await hasCompletedOnboarding(getDb(), sessionUser.id)) ? "/encontros" : "/boas-vindas",
    );
  }
  return (
    <>
      {/* Hero ocupa a primeira tela inteira, descontado o cabeçalho. */}
      <section
        aria-labelledby="landing-title"
        className="relative overflow-hidden bg-primary-hover text-primary-foreground"
      >
        <HeroTexture />
        <div
          className={`${container} relative flex min-h-[calc(100svh-4.6rem)] flex-col justify-center gap-10 py-16`}
        >
          {deleted ? (
            <p className="w-fit rounded-md bg-white/10 px-3 py-2 font-semibold">
              {accountCopy.deleted}
            </p>
          ) : null}
          <h1
            id="landing-title"
            className="max-w-[15ch] text-[2.75rem] leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[5.5rem]"
          >
            {copy.title}
          </h1>
          <div className="flex max-w-[32rem] flex-col gap-10">
            <p className="text-lg leading-relaxed text-white/80 sm:text-xl">{copy.lead}</p>
            {error ? (
              <p role="alert" className="font-semibold text-honey">
                {signInCopy.error}
              </p>
            ) : null}
            <Link
              href="/boas-vindas"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-honey px-4 text-lg font-semibold text-foreground hover:bg-honey-hover sm:max-w-xs"
            >
              {signInCopy.button}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="py-20 sm:py-24">
        <div className={container}>
          <h2 id="how-it-works" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {copy.howItWorksTitle}
          </h2>
          {/* Grade de cartões (2 colunas no celular, 3 no desktop), estática. O número de cada
              passo fica num hexágono do logo, como uma ficha sobre a borda de cima do cartão. */}
          <ol className="mt-16 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-3">
            {copy.steps.map(({ key, title, text }, index) => {
              const highlight = key === "initiative";
              return (
                <li
                  key={key}
                  data-highlight={highlight ? "true" : undefined}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl px-3 pt-12 pb-6 text-center sm:px-6 ${
                    highlight ? "bg-honey-light ring-2 ring-honey" : "bg-surface ring-1 ring-border"
                  }`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                    <NumberHexagon value={index + 1} />
                  </div>
                  <h3
                    className={`text-lg leading-snug font-bold tracking-tight ${
                      highlight ? "text-honey-light-foreground" : ""
                    }`}
                  >
                    {title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">{text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Só os nomes, da constante: a landing do visitante não lê do banco. */}
      <section aria-labelledby="communities" className="border-t border-border py-20 sm:py-24">
        <div className={`${container} grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16`}>
          <div className="flex flex-col gap-4">
            <h2 id="communities" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {copy.communitiesTitle}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{copy.communitiesText}</p>
          </div>
          <ul className="flex flex-wrap content-start gap-3">
            {COMMUNITIES.map(({ slug, name }) => (
              <li
                key={slug}
                className="rounded-full bg-tag px-4 py-2 text-lg font-semibold text-tag-foreground"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Respostas sempre visíveis, sem abrir e fechar: dá para ler tudo com calma. */}
      <section aria-labelledby="faq" className="border-t border-border bg-surface py-20 sm:py-24">
        <div className={`${container} grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16`}>
          <h2 id="faq" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {copy.faqTitle}
          </h2>
          <dl className="grid gap-10 sm:grid-cols-2 sm:gap-x-10">
            {copy.faq.map(({ question, answer }) => (
              <div key={question} className="flex flex-col gap-2">
                <dt className="text-lg leading-snug font-bold">{question}</dt>
                <dd className="leading-relaxed text-muted-foreground">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
