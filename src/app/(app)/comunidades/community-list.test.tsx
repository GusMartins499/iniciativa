import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { COMMUNITIES, type CommunitySummary } from "@/modules/communities/client";
import { CommunityList } from "./community-list";

const noop = () => async () => ({ code: null });

const communities: CommunitySummary[] = COMMUNITIES.map((community, index) => ({
  slug: community.slug,
  name: community.name,
  memberCount: index,
  isMember: community.slug === "rpg",
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

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderList();
    expect(await axe(container)).toHaveNoViolations();
  });
});
