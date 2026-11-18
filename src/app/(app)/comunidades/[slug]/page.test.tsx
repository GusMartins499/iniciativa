import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A regra (slug na lista fixa, contagem) tem teste no módulo; aqui só a tela.
vi.mock("@/modules/communities", async () => {
  const { communitiesCopy } = await import("@/modules/communities/client");
  return {
    communitiesCopy,
    getCommunityBySlug: async (_db: unknown, _userId: string, slug: string) =>
      slug === "corrida"
        ? { ok: true, data: { slug, name: "Corrida", memberCount: 1, isMember: true } }
        : { ok: false, error: { code: "NOT_FOUND" } },
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

  it("dá 404 para slug inexistente", async () => {
    await expect(CommunityPage({ params: Promise.resolve({ slug: "xadrez" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
