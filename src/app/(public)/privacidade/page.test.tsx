import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { privacyCopy } from "@/modules/users";
import PrivacyPage from "./page";

describe("política de privacidade", () => {
  it("mostra o texto completo do termo sem exigir login", () => {
    render(<PrivacyPage />);
    expect(screen.getByRole("heading", { level: 1, name: privacyCopy.title })).toBeInTheDocument();
    expect(screen.getByText(privacyCopy.version)).toBeInTheDocument();
    for (const section of privacyCopy.sections) {
      expect(screen.getByRole("heading", { level: 2, name: section.title })).toBeInTheDocument();
    }
  });

  it("diz quem é o responsável e como falar com ele", () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(/O responsável pelos seus dados é Gustavo Martins/),
    ).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<PrivacyPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
