import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { OnboardingForm, type OnboardingFormProps } from "./onboarding-form";

async function noopAction() {
  return { code: null };
}

describe("tela /boas-vindas", () => {
  it("só habilita o envio com as duas caixas marcadas", () => {
    render(<OnboardingForm action={noopAction} />);
    const continueButton = screen.getByRole("button", { name: "Continuar" });

    fireEvent.click(screen.getByRole("checkbox", { name: /sou autista/i }));
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /aceito o termo/i }));
    expect(continueButton).toBeEnabled();
  });

  it("pede confirmação explícita antes de enviar", () => {
    render(<OnboardingForm action={noopAction} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /sou autista/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /aceito o termo/i }));

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Confirmar e entrar");
  });

  it("envia as duas confirmações ao confirmar no diálogo", async () => {
    const action = vi.fn<OnboardingFormProps["action"]>(async () => ({ code: null }));
    render(<OnboardingForm action={action} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /sou autista/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /aceito o termo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.click(screen.getByRole("button", { name: "Confirmar e entrar" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({ code: null }, { declaration: true, consent: true }),
    );
  });

  it("mostra o termo marcado como provisório", () => {
    render(<OnboardingForm action={noopAction} />);
    expect(screen.getByRole("heading", { name: /PROVISÓRIO/ })).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<OnboardingForm action={noopAction} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
