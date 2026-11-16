import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { RootLayoutShell } from "./root-layout-shell";

describe("layout raiz", () => {
  it("renderiza o nome da marca em minúsculas", () => {
    render(
      <RootLayoutShell>
        <p>conteúdo</p>
      </RootLayoutShell>,
    );
    expect(screen.getByText("iniciativa")).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <RootLayoutShell>
        <p>conteúdo</p>
      </RootLayoutShell>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
