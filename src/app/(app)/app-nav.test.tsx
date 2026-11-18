import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppNav } from "./app-nav";

const pathname = vi.hoisted(() => ({ value: "/encontros" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

describe("navegação principal", () => {
  beforeEach(() => {
    pathname.value = "/encontros";
  });

  it("marca a página atual", () => {
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Próximos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Meus encontros" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("mantém 'Próximos' marcado no detalhe de um encontro", () => {
    pathname.value = "/encontros/abc";
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Próximos" })).toHaveAttribute("aria-current", "page");
  });

  it("não marca 'Próximos' na tela de criar encontro", () => {
    pathname.value = "/encontros/novo";
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Próximos" })).not.toHaveAttribute("aria-current");
  });

  it("tem 3 itens: Próximos, Meus encontros, Comunidades", () => {
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const labels = Array.from(nav.querySelectorAll("a")).map((link) => link.textContent);
    expect(labels).toEqual(["Próximos", "Meus encontros", "Comunidades"]);
  });

  it("marca 'Comunidades' na página de uma comunidade", () => {
    pathname.value = "/comunidades/rpg";
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Comunidades" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("dá nome acessível ao botão de criar e à conta", () => {
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Criar encontro" })).toHaveAttribute(
      "href",
      "/encontros/novo",
    );
    expect(screen.getByRole("link", { name: "Minha conta" })).toHaveTextContent("G");
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
