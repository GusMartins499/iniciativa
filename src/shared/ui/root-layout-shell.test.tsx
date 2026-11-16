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

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderShell();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("rodapé do layout", () => {
  it("mostra o nome do produto e a cidade do piloto", () => {
    renderShell();
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("iniciativa");
    expect(footer).toHaveTextContent("Tubarão-SC");
  });

  it("menciona o programa SIGMA PARK", () => {
    renderShell();
    expect(screen.getByRole("contentinfo")).toHaveTextContent("SIGMA PARK");
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
