import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { COMMUNITIES } from "@/modules/communities/client";
import { type CommunityCard, CommunityList } from "./community-list";

const noop = () => async () => ({ code: null });

const communities: CommunityCard[] = COMMUNITIES.map((community, index) => ({
  slug: community.slug,
  name: community.name,
  memberCount: index,
  isMember: community.slug === "rpg",
  upcomingCount: community.slug === "rpg" ? 3 : community.slug === "cinema" ? 1 : 0,
}));

function renderList() {
  return render(
    <CommunityList communities={communities} joinActionFor={noop} leaveActionFor={noop} />,
  );
}

describe("tela de comunidades", () => {
  it("lista as 9 com nome, descrição, nº de membros e link para a página", () => {
    renderList();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(9);
    const cinema = within(items[4] as HTMLElement);
    expect(cinema.getByRole("link", { name: "Cinema" })).toHaveAttribute(
      "href",
      "/comunidades/cinema",
    );
    expect(cinema.getByText("Para quem gosta de ver filmes e conversar sobre eles.")).toBeVisible();
    expect(cinema.getByText("4 pessoas participam")).toBeVisible();
    expect(within(items[1] as HTMLElement).getByText("1 pessoa participa")).toBeVisible();
  });

  it("mostra Sair onde a pessoa já participa e Entrar nas demais", () => {
    renderList();

    expect(screen.getAllByRole("button", { name: "Sair da comunidade" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Entrar na comunidade" })).toHaveLength(8);
    const rpg = within(screen.getAllByRole("listitem")[2] as HTMLElement);
    expect(rpg.getByRole("button", { name: "Sair da comunidade" })).toBeVisible();
  });

  it("mostra o nº de encontros futuros em todos os cards, também para quem não participa", () => {
    renderList();

    const items = screen.getAllByRole("listitem");
    expect(within(items[2] as HTMLElement).getByText("3 encontros futuros")).toBeVisible();
    expect(within(items[4] as HTMLElement).getByText("1 encontro futuro")).toBeVisible();
    expect(within(items[0] as HTMLElement).getByText("0 encontros futuros")).toBeVisible();
  });

  it("mostra Ver encontros, com texto e área de toque de 44px, só onde a pessoa participa", () => {
    renderList();

    const links = screen.getAllByRole("link", { name: "Ver encontros" });
    expect(links).toHaveLength(1);
    const rpg = within(screen.getAllByRole("listitem")[2] as HTMLElement);
    const link = rpg.getByRole("link", { name: "Ver encontros" });
    expect(link).toHaveAttribute("href", "/comunidades/rpg");
    expect(link).toHaveClass("min-h-11");
    const cinema = within(screen.getAllByRole("listitem")[4] as HTMLElement);
    expect(cinema.queryByRole("link", { name: "Ver encontros" })).not.toBeInTheDocument();
  });

  it("marca com um selo só os cards das comunidades de que a pessoa participa", () => {
    renderList();

    expect(screen.getAllByText("Você participa")).toHaveLength(1);
    const rpg = within(screen.getAllByRole("listitem")[2] as HTMLElement);
    expect(rpg.getByText("Você participa")).toBeVisible();
  });

  it("mostra em cada card o ícone da comunidade, só como enfeite", () => {
    renderList();

    const items = screen.getAllByRole("listitem");
    COMMUNITIES.forEach((community, index) => {
      const icon = (items[index] as HTMLElement).querySelector("[data-community-icon]");
      expect(icon).toHaveAttribute("data-community-icon", community.slug);
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderList();
    expect(await axe(container)).toHaveNoViolations();
  });
});
