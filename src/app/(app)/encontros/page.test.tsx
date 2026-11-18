import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

// A regra de visibilidade tem teste no módulo; aqui só a tela e o que ela repassa.
let memberSlugs: string[] = [];
const listUpcoming = vi.fn<
  (db: unknown, slugs: string[], filter: string) => Promise<{ ok: true; data: [] }>
>(async () => ({ ok: true, data: [] }));
const annotateActiveSpan = vi.fn<(attributes: Record<string, string>) => void>();
vi.mock("@/modules/communities", () => ({ listMemberSlugs: async () => memberSlugs }));
vi.mock("@/modules/meetups", async () => {
  const { meetupsCopy } = await import("@/modules/meetups/client");
  return { meetupsCopy, listUpcoming, listByCreator: async () => [] };
});
vi.mock("@/modules/rsvps", () => ({ listMeetupIdsByUser: async () => [] }));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("@/shared/observability", () => ({ annotateActiveSpan }));
vi.mock("../require-page-user", () => ({
  requirePageUser: async () => ({ id: "viewer", name: "Pessoa", email: "", image: null }),
}));

const { default: MeetupsPage } = await import("./page");

function renderPage(params: { publico?: string | string[] } = {}) {
  return MeetupsPage({ searchParams: Promise.resolve(params) }).then((page) => render(page));
}

function filterLinks() {
  const nav = screen.getByRole("navigation", { name: "Filtrar por público" });
  return within(nav).getAllByRole("link");
}

beforeEach(() => {
  listUpcoming.mockClear();
  annotateActiveSpan.mockClear();
});

describe("tela /encontros (Próximos)", () => {
  it("mostra a faixa para quem não está em nenhuma comunidade", async () => {
    memberSlugs = [];

    await renderPage();

    expect(screen.getByText(/Você ainda não está em nenhuma comunidade\./)).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver comunidades" })).toHaveAttribute(
      "href",
      "/comunidades",
    );
  });

  it("não mostra a faixa e lista os encontros das comunidades de quem participa", async () => {
    memberSlugs = ["rpg"];

    await renderPage();

    expect(screen.queryByText(/nenhuma comunidade/)).not.toBeInTheDocument();
    expect(listUpcoming).toHaveBeenCalledWith({}, ["rpg"], "all");
  });
});

describe("tela /encontros: filtro por público", () => {
  it("oferece Todos, Abertos e só as comunidades da pessoa, na ordem da lista fixa", async () => {
    memberSlugs = ["cinema", "rpg"];

    await renderPage();

    const links = filterLinks();
    expect(links.map((link) => link.textContent)).toEqual(["Todos", "Abertos", "RPG", "Cinema"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/encontros",
      "/encontros?publico=abertos",
      "/encontros?publico=rpg",
      "/encontros?publico=cinema",
    ]);
  });

  it("sem comunidades, mostra só Todos e Abertos, e a faixa continua", async () => {
    memberSlugs = [];

    await renderPage();

    expect(filterLinks().map((link) => link.textContent)).toEqual(["Todos", "Abertos"]);
    expect(screen.getByText(/Você ainda não está em nenhuma comunidade\./)).toBeVisible();
  });

  it("o padrão é Todos, indicado com aria-current", async () => {
    memberSlugs = ["rpg"];

    await renderPage();

    expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute("aria-current", "true");
    expect(
      within(screen.getByRole("navigation", { name: "Filtrar por público" })).getByRole("link", {
        name: "RPG",
      }),
    ).not.toHaveAttribute("aria-current");
    expect(listUpcoming).toHaveBeenCalledWith({}, ["rpg"], "all");
    expect(annotateActiveSpan).toHaveBeenCalledWith({ audienceFilter: "all" });
  });

  it.each([
    ["rpg", "rpg", "RPG"],
    ["abertos", "open", "Abertos"],
  ])("?publico=%s filtra por %s e marca o item escolhido", async (param, filter, label) => {
    memberSlugs = ["rpg"];

    await renderPage({ publico: param });

    const chosen = filterLinks().find((link) => link.textContent === label);
    expect(chosen).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Todos" })).not.toHaveAttribute("aria-current");
    expect(listUpcoming).toHaveBeenCalledWith({}, ["rpg"], filter);
    expect(annotateActiveSpan).toHaveBeenCalledWith({ audienceFilter: filter });
  });

  it.each([["xadrez"], ["cinema"], [["rpg", "rpg"]], [""]])(
    "valor inválido ou comunidade alheia (%j) cai em Todos sem erro",
    async (param) => {
      memberSlugs = ["rpg"];

      await renderPage({ publico: param });

      expect(listUpcoming).toHaveBeenCalledWith({}, ["rpg"], "all");
      expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute("aria-current", "true");
      expect(annotateActiveSpan).toHaveBeenCalledWith({ audienceFilter: "all" });
    },
  );

  it("filtro sem resultado mostra a mensagem literal e o link para Todos", async () => {
    memberSlugs = ["rpg"];

    await renderPage({ publico: "rpg" });

    expect(screen.getByText("Nenhum encontro de RPG marcado.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver todos os encontros" })).toHaveAttribute(
      "href",
      "/encontros",
    );
  });

  it('"Abertos" sem resultado mostra a mensagem literal', async () => {
    memberSlugs = ["rpg"];

    await renderPage({ publico: "abertos" });

    expect(screen.getByText("Nenhum encontro aberto marcado.")).toBeVisible();
  });

  it("Todos sem resultado mantém a mensagem de lista vazia, sem o link", async () => {
    memberSlugs = ["rpg"];

    await renderPage();

    expect(screen.getByText("Ainda não há encontros marcados.")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ver todos os encontros" })).not.toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    memberSlugs = ["rpg"];

    const { container } = await renderPage({ publico: "rpg" });

    expect(await axe(container)).toHaveNoViolations();
  });
});
