import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { COMMUNITIES } from "@/modules/communities/client";
import { accountCopy, signInCopy } from "@/modules/users/client";
import { landingCopy } from "./copy";
import LandingPage from "./page";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn<() => Promise<{ id: string; name: string } | null>>(),
  hasCompletedOnboarding: vi.fn<() => Promise<boolean>>(),
  getDb: vi.fn<() => object>(() => ({})),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/shared/auth", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/modules/users", () => ({ hasCompletedOnboarding: mocks.hasCompletedOnboarding }));
vi.mock("@/shared/db", () => ({ getDb: mocks.getDb }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSessionUser.mockResolvedValue(null);
});

async function renderPage(params: { error?: string; deleted?: string } = {}) {
  return render(await LandingPage({ searchParams: Promise.resolve(params) }));
}

describe("tela inicial", () => {
  it("explica o que é o iniciativa", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: landingCopy.title })).toBeInTheDocument();
    expect(screen.getByText(landingCopy.lead)).toBeInTheDocument();
    for (const step of landingCopy.steps) {
      expect(screen.getByRole("heading", { level: 3, name: step.title })).toBeInTheDocument();
      expect(screen.getByText(step.text)).toBeInTheDocument();
    }
  });

  it("mantém o título e apresenta as comunidades no lead", () => {
    expect(landingCopy.title).toBe("Promovemos encontros face a face para jovens autistas");
    expect(landingCopy.lead).toBe("Entre nas suas comunidades, proponha um encontro e divirta-se.");
  });

  it("mostra de 5 a 6 passos, na ordem, incluindo comunidades e comentários", async () => {
    await renderPage();
    expect(landingCopy.steps.length).toBeGreaterThanOrEqual(5);
    expect(landingCopy.steps.length).toBeLessThanOrEqual(6);
    const keys = landingCopy.steps.map((step) => step.key);
    expect(keys).toEqual(expect.arrayContaining(["communities", "comments", "initiative"]));
    const section = screen.getByRole("region", { name: landingCopy.howItWorksTitle });
    // A ordem de leitura é a ordem do DOM: os itens da lista seguem a ordem dos passos.
    const items = within(within(section).getByRole("list")).getAllByRole("listitem");
    expect(
      items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(landingCopy.steps.map((step) => step.title));
  });

  it("dá destaque ao passo Tome INICIATIVA", async () => {
    await renderPage();
    const initiative = screen.getByRole("heading", { level: 3, name: "Tome INICIATIVA" });
    expect(initiative.closest("li")).toHaveAttribute("data-highlight", "true");
    const others = screen
      .getAllByRole("listitem")
      .filter((item) => item.hasAttribute("data-highlight") && item !== initiative.closest("li"));
    expect(others).toEqual([]);
  });

  it("lista as 9 comunidades pelo nome", async () => {
    await renderPage();
    const section = screen.getByRole("region", { name: landingCopy.communitiesTitle });
    const names = within(within(section).getByRole("list"))
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(names).toEqual(COMMUNITIES.map((community) => community.name));
  });

  it("mostra cada comunidade com a cor e o ícone dela, e o ícone só como enfeite", async () => {
    await renderPage();
    const section = screen.getByRole("region", { name: landingCopy.communitiesTitle });
    const items = within(within(section).getByRole("list")).getAllByRole("listitem");
    COMMUNITIES.forEach((community, index) => {
      const icon = (items[index] as HTMLElement).querySelector("[data-community-icon]");
      expect(icon).toHaveAttribute("data-community-icon", community.slug);
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("não consulta o banco quando o visitante não tem sessão", async () => {
    await renderPage();
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.hasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it("responde quem vê o nome e a foto, o que acontece quando o encontro muda e se dá para criar comunidade", () => {
    const questions = landingCopy.faq.map(({ question }) => question);
    expect(questions).toContain("Quem vê o meu nome e a minha foto?");
    expect(questions).toContain("E se o encontro mudar ou for cancelado?");
    const changed = landingCopy.faq.find(({ question }) => question.includes("mudar"));
    expect(changed?.answer).toMatch(/não manda notificações/i);
    expect(changed?.answer).toMatch(/comentários/i);
    expect(landingCopy.faq).toContainEqual({
      question: "Posso criar uma comunidade nova?",
      answer: "Ainda não. Por enquanto existem só estas 9.",
    });
  });

  it("responde as perguntas frequentes, com as respostas à vista", async () => {
    await renderPage();
    expect(
      screen.getByRole("heading", { level: 2, name: landingCopy.faqTitle }),
    ).toBeInTheDocument();
    for (const { question, answer } of landingCopy.faq) {
      expect(screen.getByText(question)).toBeVisible();
      expect(screen.getByText(answer)).toBeVisible();
    }
  });

  it("não diz que o app não tem conversa nem que só o criador vê o seu nome", () => {
    for (const { answer } of landingCopy.faq) {
      expect(answer).not.toMatch(/não tem chat/i);
      expect(answer).not.toMatch(/só quem criou o encontro vê/i);
    }
  });

  it("tem o login com Google como ação principal", async () => {
    await renderPage();
    // Só leva aos termos: a conta nasce no "Confirmar e entrar" de /boas-vindas.
    expect(screen.getByRole("link", { name: signInCopy.button })).toHaveAttribute(
      "href",
      "/boas-vindas",
    );
  });

  it("manda quem já entrou para os encontros", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: "membro", name: "Ana" });
    mocks.hasCompletedOnboarding.mockResolvedValue(true);
    await expect(renderPage()).rejects.toThrow("redirect:/encontros");
  });

  it("manda quem entrou sem autodeclaração para os termos", async () => {
    mocks.getSessionUser.mockResolvedValue({ id: "pendente", name: "Bia" });
    mocks.hasCompletedOnboarding.mockResolvedValue(false);
    await expect(renderPage()).rejects.toThrow("redirect:/boas-vindas");
  });

  it("avisa quando o login falhou", async () => {
    await renderPage({ error: "1" });
    expect(screen.getByRole("alert")).toHaveTextContent(signInCopy.error);
  });

  it("avisa que a conta foi excluída", async () => {
    await renderPage({ deleted: "1" });
    expect(screen.getByText(accountCopy.deleted)).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = await renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
