import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DeleteAccountPanel, type DeleteAccountPanelProps } from "./delete-account-panel";

const noop = async () => ({ code: null });

describe("tela /conta", () => {
  it("pede confirmação explícita com verbo literal antes de excluir", async () => {
    const action = vi.fn<DeleteAccountPanelProps["action"]>(noop);
    render(<DeleteAccountPanel action={action} />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Excluir minha conta");
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(dialog.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(action).toHaveBeenCalled());
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<DeleteAccountPanel action={noop} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
