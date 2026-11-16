import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { PublicMeetup } from "@/modules/meetups/client";
import { MyMeetupsView } from "./my-meetups-view";

function meetup(overrides: Partial<PublicMeetup>): PublicMeetup {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Café",
    address: "Rua X, 100",
    placeDescription: null,
    startsAt: new Date("2026-12-05T18:00:00.000Z"),
    endsAt: new Date("2026-12-05T20:00:00.000Z"),
    capacity: 10,
    occupiedSeats: 1,
    status: "active",
    editedAt: null,
    isFull: false,
    ...overrides,
  };
}

describe("tela /meus-encontros", () => {
  it("mostra o aviso de alterado e de cancelado", () => {
    render(
      <MyMeetupsView
        created={[meetup({ editedAt: new Date("2026-11-21T12:00:00.000Z") })]}
        confirmed={[meetup({ id: "00000000-0000-0000-0000-000000000002", status: "cancelled" })]}
      />,
    );

    expect(screen.getByText("Este encontro foi alterado.")).toBeInTheDocument();
    expect(screen.getByText("Este encontro foi cancelado.")).toBeInTheDocument();
  });

  it("mostra texto literal quando a seção está vazia", () => {
    render(<MyMeetupsView created={[]} confirmed={[]} />);

    expect(screen.getByText("Você ainda não criou nenhum encontro.")).toBeInTheDocument();
    expect(
      screen.getByText("Você ainda não confirmou presença em nenhum encontro."),
    ).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <MyMeetupsView
        created={[meetup({})]}
        confirmed={[meetup({ id: "00000000-0000-0000-0000-000000000002" })]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
