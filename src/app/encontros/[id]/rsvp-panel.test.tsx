import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RsvpPanel, type RsvpPanelProps } from "./rsvp-panel";

const noop = async () => ({ code: null });

describe("tela do encontro", () => {
  it("pede confirmação explícita com verbo literal antes de cancelar", async () => {
    const cancelAction = vi.fn<RsvpPanelProps["cancelAction"]>(noop);
    render(
      <RsvpPanel
        status={{ kind: "confirmed", withCompanion: false }}
        confirmAction={noop}
        cancelAction={cancelAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar minha presença" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Cancelar minha presença");
    expect(cancelAction).not.toHaveBeenCalled();
    fireEvent.click(dialog.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(cancelAction).toHaveBeenCalled());
  });

  it("envia a confirmação com o acompanhante marcado", async () => {
    const confirmAction = vi.fn<RsvpPanelProps["confirmAction"]>(noop);
    render(
      <RsvpPanel
        status={{ kind: "open", full: false }}
        confirmAction={confirmAction}
        cancelAction={noop}
      />,
    );

    fireEvent.click(screen.getByLabelText("Vou levar 1 acompanhante"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar minha presença" }));
    fireEvent.click(screen.getByRole("dialog").querySelector("button") as HTMLButtonElement);

    await waitFor(() =>
      expect(confirmAction).toHaveBeenCalledWith({ code: null }, { withCompanion: true }),
    );
  });

  it("desabilita a confirmação quando o encontro está lotado", () => {
    render(
      <RsvpPanel status={{ kind: "open", full: true }} confirmAction={noop} cancelAction={noop} />,
    );

    expect(screen.getByText("Este encontro está lotado.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar minha presença" })).toBeDisabled();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <RsvpPanel status={{ kind: "open", full: false }} confirmAction={noop} cancelAction={noop} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
