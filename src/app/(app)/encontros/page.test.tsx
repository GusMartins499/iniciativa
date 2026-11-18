import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A regra de visibilidade tem teste no módulo; aqui só a tela e o que ela repassa.
let memberSlugs: string[] = [];
const listUpcoming = vi.fn<(db: unknown, slugs: string[]) => Promise<{ ok: true; data: [] }>>(
  async () => ({ ok: true, data: [] }),
);
vi.mock("@/modules/communities", () => ({ listMemberSlugs: async () => memberSlugs }));
vi.mock("@/modules/meetups", async () => {
  const { meetupsCopy } = await import("@/modules/meetups/client");
  return { meetupsCopy, listUpcoming, listByCreator: async () => [] };
});
vi.mock("@/modules/rsvps", () => ({ listMeetupIdsByUser: async () => [] }));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("../require-page-user", () => ({
  requirePageUser: async () => ({ id: "viewer", name: "Pessoa", email: "", image: null }),
}));

const { default: MeetupsPage } = await import("./page");

beforeEach(() => {
  listUpcoming.mockClear();
});

describe("tela /encontros (Próximos)", () => {
  it("mostra a faixa para quem não está em nenhuma comunidade", async () => {
    memberSlugs = [];

    render(await MeetupsPage());

    expect(screen.getByText(/Você ainda não está em nenhuma comunidade\./)).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver comunidades" })).toHaveAttribute(
      "href",
      "/comunidades",
    );
  });

  it("não mostra a faixa e lista os encontros das comunidades de quem participa", async () => {
    memberSlugs = ["rpg"];

    render(await MeetupsPage());

    expect(screen.queryByText(/nenhuma comunidade/)).not.toBeInTheDocument();
    expect(listUpcoming).toHaveBeenCalledWith({}, ["rpg"]);
  });
});
