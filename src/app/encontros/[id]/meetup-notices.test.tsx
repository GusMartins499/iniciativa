import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeetupNotices } from "./meetup-notices";

describe("avisos do encontro", () => {
  it("mostra o aviso de cancelado no detalhe", () => {
    render(<MeetupNotices status="cancelled" edited={false} />);
    expect(screen.getByText("Este encontro foi cancelado.")).toBeInTheDocument();
  });

  it("mostra o aviso de alterado", () => {
    render(<MeetupNotices status="active" edited />);
    expect(screen.getByText("Este encontro foi alterado.")).toBeInTheDocument();
  });

  it("não mostra nada para encontro ativo sem alteração", () => {
    const { container } = render(<MeetupNotices status="active" edited={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
