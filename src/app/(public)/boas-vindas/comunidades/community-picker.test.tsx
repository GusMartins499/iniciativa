import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { COMMUNITIES } from "@/modules/communities/client";
import { CommunityPicker, type CommunityPickerProps } from "./community-picker";

const noop = async () => ({ code: null });

describe("passo Escolha suas comunidades", () => {
  it("mostra as 9 comunidades marcáveis, nenhuma pré-marcada", () => {
    render(<CommunityPicker communities={COMMUNITIES} action={noop} />);

    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(9);
    for (const box of boxes) expect(box).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /RPG/ })).toBeInTheDocument();
  });

  it("dá para pular sem marcar nenhuma, indo para Próximos", () => {
    render(<CommunityPicker communities={COMMUNITIES} action={noop} />);

    expect(screen.getByRole("link", { name: "Pular" })).toHaveAttribute("href", "/encontros");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  it("pede confirmação e envia todas as marcadas de uma vez", async () => {
    const action = vi.fn<CommunityPickerProps["action"]>(noop);
    render(<CommunityPicker communities={COMMUNITIES} action={action} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /RPG/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Cinema/ }));

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Você vai entrar em RPG e Cinema.");
    expect(action).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Entrar nas comunidades" }));

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({ code: null }, { slugs: ["rpg", "cinema"] }),
    );
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro em texto junto da ação", async () => {
    const action = vi.fn<CommunityPickerProps["action"]>(async () => ({ code: "UNEXPECTED" }));
    render(<CommunityPicker communities={COMMUNITIES} action={action} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Corrida/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Entrar nas comunidades" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado. Tente de novo.");
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<CommunityPicker communities={COMMUNITIES} action={noop} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
