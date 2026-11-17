import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { RootLayoutShell } from "./root-layout-shell";

function renderShell() {
  return render(
    <RootLayoutShell>
      <p>conteúdo</p>
    </RootLayoutShell>,
  );
}

describe("layout raiz", () => {
  it("renderiza o nome da marca em minúsculas no cabeçalho", () => {
    renderShell();
    expect(within(screen.getByRole("banner")).getByText("iniciativa")).toBeInTheDocument();
  });

  it("usa a largura estreita por padrão e a larga quando pedida", () => {
    const { unmount } = renderShell();
    expect(screen.getByRole("main")).toHaveClass("max-w-3xl");
    unmount();
    render(
      <RootLayoutShell width="wide">
        <p>conteúdo</p>
      </RootLayoutShell>,
    );
    expect(screen.getByRole("banner")).toHaveClass("max-w-6xl");
    expect(screen.getByRole("main")).not.toHaveClass("max-w-3xl");
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderShell();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("rodapé do layout", () => {
  it("mostra o nome do produto", () => {
    renderShell();
    expect(within(screen.getByRole("contentinfo")).getByText("iniciativa")).toBeInTheDocument();
  });

  it("mostra o copyright com o ano atual", () => {
    renderShell();
    const year = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
    }).format(new Date());
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      `© ${year} iniciativa. Todos os direitos reservados.`,
    );
  });

  it("leva à política de privacidade", () => {
    renderShell();
    expect(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Política de privacidade",
      }),
    ).toHaveAttribute("href", "/privacidade");
  });

  it("fica depois do conteúdo principal", () => {
    renderShell();
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderShell();
    expect(await axe(container)).toHaveNoViolations();
  });
});
