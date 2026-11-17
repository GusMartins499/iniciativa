import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

describe("avatar", () => {
  it("mostra a foto de perfil quando existe", () => {
    const { container } = render(<Avatar name="Gustavo" image="https://exemplo.test/foto.png" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://exemplo.test/foto.png");
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(container).not.toHaveTextContent("G");
  });

  it("sem foto, mostra a inicial do primeiro nome", () => {
    const { container } = render(<Avatar name="  gustavo silva" image={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("G");
  });

  it("se a foto não carregar, volta para a inicial", () => {
    const { container } = render(<Avatar name="Ana" image="https://exemplo.test/quebrada.png" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("A");
  });
});
