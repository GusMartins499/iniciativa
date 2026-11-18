import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

const PHOTO = "https://lh3.googleusercontent.com/a/foto-sintetica=s96-c";

function photoOf(container: HTMLElement): HTMLImageElement {
  const img = container.querySelector("img");
  if (!img) throw new Error("sem <img>");
  return img;
}

describe("avatar", () => {
  it("serve a foto pelo proxy de imagem do app, nunca direto do Google", () => {
    const { container } = render(<Avatar name="Gustavo" image={PHOTO} />);
    const img = photoOf(container);
    const sources = [
      img.getAttribute("src") ?? "",
      ...(img.getAttribute("srcset") ?? "").split(",").map((c) => c.trim().split(" ")[0] ?? ""),
    ];
    for (const source of sources) {
      // O jsdom pode resolver o src contra a origem do documento; o que importa é não ser o Google.
      const url = new URL(source, document.baseURI);
      expect(url.origin).toBe(new URL(document.baseURI).origin);
      expect(url.pathname).toBe("/_next/image");
      expect(url.searchParams.get("url")).toBe(PHOTO);
    }
    expect(container).not.toHaveTextContent("G");
  });

  it("pede uma imagem pequena: 40 px por padrão", () => {
    const img = photoOf(render(<Avatar name="Ana" image={PHOTO} />).container);
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");
  });

  it("pede 32 px no avatar pequeno", () => {
    const img = photoOf(render(<Avatar name="Ana" image={PHOTO} size={32} />).container);
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("height", "32");
  });

  it("sem foto, mostra a inicial do primeiro nome", () => {
    const { container } = render(<Avatar name="  gustavo silva" image={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("G");
  });

  it("se a foto não carregar, volta para a inicial", () => {
    const { container } = render(<Avatar name="Ana" image={PHOTO} />);
    fireEvent.error(photoOf(container));
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("A");
  });

  it("continua decorativo: o nome vem por texto de quem usa o avatar", () => {
    const { container } = render(<Avatar name="Ana" image={PHOTO} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(photoOf(container)).toHaveAttribute("alt", "");
  });
});
