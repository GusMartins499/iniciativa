import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AttendeeList } from "./attendee-list";

const PHOTO = "https://lh3.googleusercontent.com/a/foto-sintetica=s96-c";

describe("lista de confirmados do encontro", () => {
  it("mostra a foto (pelo proxy) ou a inicial ao lado do primeiro nome", async () => {
    const { container } = render(
      <AttendeeList
        attendees={[
          { firstName: "Ana", image: PHOTO, withCompanion: true },
          { firstName: "Bia", image: null, withCompanion: false },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const photo = items[0]?.querySelector("img");
    const src = new URL(photo?.getAttribute("src") ?? "", document.baseURI);
    expect(src.origin).toBe(new URL(document.baseURI).origin);
    expect(src.pathname).toBe("/_next/image");
    expect(photo).toHaveAttribute("width", "32");
    expect(items[0]).toHaveTextContent("Ana");
    expect(items[1]?.querySelector("img")).toBeNull();
    expect(items[1]).toHaveTextContent("B");
    expect(items[1]).toHaveTextContent("Bia");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sem confirmados, mostra o aviso de lista vazia", async () => {
    const { container } = render(<AttendeeList attendees={[]} />);

    expect(screen.getByText("Ninguém confirmou presença ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
