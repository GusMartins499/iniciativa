import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { onboardingCopy } from "@/modules/users";
import { OnboardingForm } from "./onboarding-form";

async function noopAction() {
  return { code: null };
}

describe("tela /boas-vindas", () => {
  it("só habilita o envio com as duas caixas marcadas", () => {
    render(<OnboardingForm copy={onboardingCopy} action={noopAction} />);
    const botaoContinuar = screen.getByRole("button", { name: "Continuar" });

    fireEvent.click(screen.getByRole("checkbox", { name: /sou autista/i }));
    expect(botaoContinuar).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /aceito o termo/i }));
    expect(botaoContinuar).toBeEnabled();
  });

  it("pede confirmação explícita antes de enviar", () => {
    render(<OnboardingForm copy={onboardingCopy} action={noopAction} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /sou autista/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /aceito o termo/i }));

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Confirmar e entrar");
  });

  it("mostra o termo marcado como provisório", () => {
    render(<OnboardingForm copy={onboardingCopy} action={noopAction} />);
    expect(screen.getByRole("heading", { name: /PROVISÓRIO/ })).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<OnboardingForm copy={onboardingCopy} action={noopAction} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
