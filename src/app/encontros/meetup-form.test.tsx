import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MeetupForm, type MeetupFormProps } from "./meetup-form";

function fill(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  fill("Título", "Café no centro");
  fill("Data", "2026-12-05");
  fill("Horário de início", "15:00");
  fill("Horário de término", "17:00");
  fill("Endereço", "Rua X, 100");
  fill(/Número de vagas/, "10");
  fireEvent.click(screen.getByLabelText(/local é público/));
}

describe("tela /encontros/novo", () => {
  it("mostra os erros junto dos campos e não abre a confirmação", async () => {
    render(<MeetupForm action={async () => ({ code: null })} />);

    fireEvent.click(screen.getByRole("button", { name: "Publicar encontro" }));

    expect(await screen.findByText("Escreva um título de até 100 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Confirme que o local é público.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pede confirmação e envia o encontro com data e horários locais", async () => {
    const action = vi.fn<MeetupFormProps["action"]>(async () => ({ code: null }));
    render(<MeetupForm action={action} />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Publicar encontro" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      Array.from(dialog.querySelectorAll("button")).find(
        (b) => b.textContent === "Publicar encontro",
      )!,
    );

    await waitFor(() =>
      expect(action).toHaveBeenCalledWith(
        { code: null },
        expect.objectContaining({
          startsAt: "2026-12-05T15:00",
          endsAt: "2026-12-05T17:00",
          capacity: 10,
          publicPlace: true,
          withCompanion: false,
        }),
      ),
    );
  });

  it("no modo de edição vem preenchido, sem o campo de acompanhante", () => {
    render(
      <MeetupForm
        mode="edit"
        action={async () => ({ code: null })}
        defaultValues={{ title: "Café no centro", capacity: 10, publicPlace: true }}
      />,
    );

    expect(screen.getByLabelText("Título")).toHaveValue("Café no centro");
    expect(screen.queryByLabelText("Vou levar 1 acompanhante")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<MeetupForm action={async () => ({ code: null })} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
