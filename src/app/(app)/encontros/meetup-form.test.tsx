import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MeetupForm, type MeetupFormProps } from "./meetup-form";

const audiences = [
  { value: "open", label: "Aberto (todos)" },
  { value: "rpg", label: "RPG" },
];

function fill(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm({ audience = true } = {}) {
  fill("Título", "Café no centro");
  fill("Data", "2026-12-05");
  fill("Horário de início", "15:00");
  fill("Horário de término", "17:00");
  fill("Endereço", "Rua X, 100");
  fill(/Número de vagas/, "10");
  fireEvent.click(screen.getByLabelText(/local é público/));
  if (audience) fireEvent.click(screen.getByLabelText("RPG"));
}

describe("tela /encontros/novo", () => {
  it("mostra os erros junto dos campos e não abre a confirmação", async () => {
    render(<MeetupForm action={async () => ({ code: null })} audiences={audiences} />);

    fireEvent.click(screen.getByRole("button", { name: "Publicar encontro" }));

    expect(await screen.findByText("Escreva um título de até 100 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("Confirme que o local é público.")).toBeInTheDocument();
    expect(screen.getByText("Escolha o público do encontro.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("oferece Aberto e as comunidades recebidas, sem nada pré-marcado", () => {
    render(<MeetupForm action={async () => ({ code: null })} audiences={audiences} />);

    const group = screen.getByRole("radiogroup", { name: "Público" });
    const options = within(group).getAllByRole("radio");
    expect(options.map((radio) => radio.getAttribute("value"))).toEqual(["open", "rpg"]);
    expect(options.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });

  it("recusa o envio sem público e mostra o que falta", async () => {
    const action = vi.fn<MeetupFormProps["action"]>(async () => ({ code: null }));
    render(<MeetupForm action={action} audiences={audiences} />);
    fillValidForm({ audience: false });

    fireEvent.click(screen.getByRole("button", { name: "Publicar encontro" }));

    expect(await screen.findByText("Escolha o público do encontro.")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("pede confirmação e envia o encontro com data e horários locais", async () => {
    const action = vi.fn<MeetupFormProps["action"]>(async () => ({ code: null }));
    render(<MeetupForm action={action} audiences={audiences} />);
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
          audience: "rpg",
        }),
      ),
    );
  });

  it("no modo de edição vem preenchido, sem o campo de acompanhante", () => {
    render(
      <MeetupForm
        mode="edit"
        action={async () => ({ code: null })}
        defaultValues={{
          title: "Café no centro",
          capacity: 10,
          publicPlace: true,
          audience: "rpg",
        }}
        audiences={[{ value: "rpg", label: "RPG" }]}
      />,
    );

    expect(screen.getByLabelText("Título")).toHaveValue("Café no centro");
    const audience = screen.getByLabelText("Público");
    expect(audience).toHaveValue("RPG");
    expect(audience).toHaveAttribute("readonly");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Vou levar 1 acompanhante")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <MeetupForm action={async () => ({ code: null })} audiences={audiences} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
