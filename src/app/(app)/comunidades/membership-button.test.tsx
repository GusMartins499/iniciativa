import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MembershipButton, type MembershipButtonProps } from "./membership-button";

const noop = async () => ({ code: null });

describe("botão de entrar e sair da comunidade", () => {
  it("pede confirmação explícita antes de entrar", async () => {
    const joinAction = vi.fn<MembershipButtonProps["joinAction"]>(noop);
    render(
      <MembershipButton name="RPG" isMember={false} joinAction={joinAction} leaveAction={noop} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar na comunidade" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Entrar na comunidade");
    expect(dialog).toHaveTextContent("Você vai entrar em RPG.");
    expect(joinAction).not.toHaveBeenCalled();
    fireEvent.click(dialog.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(joinAction).toHaveBeenCalled());
  });

  it("pede confirmação explícita antes de sair", async () => {
    const leaveAction = vi.fn<MembershipButtonProps["leaveAction"]>(noop);
    render(<MembershipButton name="RPG" isMember joinAction={noop} leaveAction={leaveAction} />);

    expect(screen.queryByRole("button", { name: "Entrar na comunidade" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sair da comunidade" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Sair da comunidade");
    expect(leaveAction).not.toHaveBeenCalled();
    fireEvent.click(dialog.querySelector("button") as HTMLButtonElement);
    await waitFor(() => expect(leaveAction).toHaveBeenCalled());
  });

  it("não executa nada se a pessoa voltar no diálogo", () => {
    const joinAction = vi.fn<MembershipButtonProps["joinAction"]>(noop);
    render(
      <MembershipButton name="RPG" isMember={false} joinAction={joinAction} leaveAction={noop} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar na comunidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(joinAction).not.toHaveBeenCalled();
  });

  it("mostra o erro em texto junto da ação", async () => {
    const joinAction = async () => ({ code: "UNEXPECTED" as const });
    render(
      <MembershipButton name="RPG" isMember={false} joinAction={joinAction} leaveAction={noop} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar na comunidade" }));
    fireEvent.click(screen.getByRole("dialog").querySelector("button") as HTMLButtonElement);

    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado. Tente de novo.");
  });
});

describe("acessibilidade do botão de comunidade", () => {
  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <MembershipButton name="RPG" isMember={false} joinAction={noop} leaveAction={noop} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
