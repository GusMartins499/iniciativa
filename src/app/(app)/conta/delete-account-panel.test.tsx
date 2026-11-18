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

  it("lista a participação nas comunidades e os comentários entre as consequências", () => {
    render(<DeleteAccountPanel action={noop} />);

    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toContain("Apaga a sua participação nas comunidades.");
    expect(items).toContain('Troca os seus comentários por "Comentário apagado".');
  });

  it("o diálogo de confirmação cita as comunidades e os comentários", () => {
    render(<DeleteAccountPanel action={noop} />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir minha conta" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("participação nas comunidades");
    expect(dialog).toHaveTextContent('Troca os seus comentários por "Comentário apagado".');
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<DeleteAccountPanel action={noop} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
