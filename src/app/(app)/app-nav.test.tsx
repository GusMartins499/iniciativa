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
    expect(screen.getByRole("link", { name: "Encontros" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Meus encontros" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("mantém 'Encontros' marcado no detalhe de um encontro", () => {
    pathname.value = "/encontros/abc";
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Encontros" })).toHaveAttribute("aria-current", "page");
  });

  it("não marca 'Encontros' na tela de criar encontro", () => {
    pathname.value = "/encontros/novo";
    render(<AppNav user={{ name: "Gustavo", image: null }} />);
    expect(screen.getByRole("link", { name: "Encontros" })).not.toHaveAttribute("aria-current");
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
