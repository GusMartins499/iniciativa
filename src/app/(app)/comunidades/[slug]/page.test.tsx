import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicMeetup } from "@/modules/meetups/client";

// A regra (slug na lista fixa, contagem) tem teste no módulo; aqui só a tela.
vi.mock("@/modules/communities", async () => {
  const { communitiesCopy } = await import("@/modules/communities/client");
  return {
    communitiesCopy,
    getCommunityBySlug: async (_db: unknown, _userId: string, slug: string) =>
      slug === "corrida" || slug === "rpg"
        ? {
            ok: true,
            data: {
              slug,
              name: slug === "rpg" ? "RPG" : "Corrida",
              memberCount: 1,
              isMember: slug === "corrida",
            },
          }
        : { ok: false, error: { code: "NOT_FOUND" } },
  };
});
const listUpcomingByCommunity = vi.fn<() => Promise<PublicMeetup[]>>(async () => [
  {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Corrida na beira-rio",
    address: "Av. Beira-Rio",
    placeDescription: null,
    startsAt: new Date("2026-12-05T10:00:00.000Z"),
    endsAt: new Date("2026-12-05T11:00:00.000Z"),
    capacity: 10,
    occupiedSeats: 1,
    status: "active",
    editedAt: null,
    communitySlug: "corrida",
    isFull: false,
  },
]);
vi.mock("@/modules/meetups", async () => {
  const { meetupsCopy } = await import("@/modules/meetups/client");
  return {
    meetupsCopy,
    countUpcomingByCommunity: async () => 1,
    listUpcomingByCommunity,
  };
});
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("../../require-page-user", () => ({
  requirePageUser: async () => ({ id: "viewer", name: "Pessoa", email: "", image: null }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("../actions", () => ({
  joinCommunityAction: async () => ({ code: null }),
  leaveCommunityAction: async () => ({ code: null }),
}));

const { default: CommunityPage } = await import("./page");

describe("página da comunidade", () => {
  it("mostra a descrição, a contagem e o botão de sair para quem participa", async () => {
    render(await CommunityPage({ params: Promise.resolve({ slug: "corrida" }) }));

    expect(screen.getByRole("heading", { level: 1, name: "Corrida" })).toBeVisible();
    expect(screen.getByText("Para quem corre ou quer começar a correr.")).toBeVisible();
    expect(screen.getByText("1 pessoa participa")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sair da comunidade" })).toBeVisible();
  });

  it("mostra o nº de encontros futuros e a lista para quem participa", async () => {
    render(await CommunityPage({ params: Promise.resolve({ slug: "corrida" }) }));

    expect(screen.getByText("1 encontro futuro")).toBeVisible();
    expect(screen.getByRole("link", { name: /Corrida na beira-rio/ })).toBeVisible();
  });

  it("mostra só o nº de encontros futuros para quem não participa", async () => {
    listUpcomingByCommunity.mockClear();

    render(await CommunityPage({ params: Promise.resolve({ slug: "rpg" }) }));

    expect(screen.getByText("1 encontro futuro")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Corrida na beira-rio/ })).not.toBeInTheDocument();
    expect(listUpcomingByCommunity).not.toHaveBeenCalled();
  });

  it("dá 404 para slug inexistente", async () => {
    await expect(CommunityPage({ params: Promise.resolve({ slug: "xadrez" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
