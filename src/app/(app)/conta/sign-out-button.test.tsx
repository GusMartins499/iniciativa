import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./sign-out-button";

const signOut = vi.hoisted(() => vi.fn<() => Promise<{ error: unknown }>>());
vi.mock("@/shared/auth/client", () => ({ authClient: { signOut } }));

describe("sair da conta", () => {
  it("avisa quando não foi possível sair e libera o botão de novo", async () => {
    signOut.mockResolvedValue({ error: { message: "falhou" } });
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível sair");
    expect(screen.getByRole("button", { name: "Sair da conta" })).toBeEnabled();
  });
});
