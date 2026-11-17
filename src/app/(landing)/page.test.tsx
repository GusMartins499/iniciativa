import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { accountCopy, signInCopy } from "@/modules/users/client";
import { landingCopy } from "./copy";
import LandingPage from "./page";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn<() => Promise<{ id: string; name: string } | null>>(),
  hasCompletedOnboarding: vi.fn<() => Promise<boolean>>(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/shared/auth", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/modules/users", () => ({ hasCompletedOnboarding: mocks.hasCompletedOnboarding }));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));

beforeEach(() => {
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
