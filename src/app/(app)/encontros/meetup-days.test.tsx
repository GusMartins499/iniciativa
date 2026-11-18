import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { PublicMeetup } from "@/modules/meetups/client";
import { groupByDay, MeetupDays } from "./meetup-days";

function meetup(overrides: Partial<PublicMeetup>): PublicMeetup {
  return {
    id: "m1",
    title: "Café no centro",
    address: "Rua X, 100",
    placeDescription: null,
    startsAt: new Date("2026-12-05T18:00:00.000Z"),
    endsAt: new Date("2026-12-05T20:00:00.000Z"),
    capacity: 10,
    occupiedSeats: 4,
    status: "active",
    editedAt: null,
    communitySlug: null,
    isFull: false,
    ...overrides,
  };
}

const sameDay = meetup({
  id: "m2",
  title: "Caminhada",
  startsAt: new Date("2026-12-05T20:30:00.000Z"),
  endsAt: new Date("2026-12-05T22:00:00.000Z"),
});
const nextWeek = meetup({
  id: "m3",
  title: "Jogos",
  startsAt: new Date("2026-12-12T17:00:00.000Z"),
  endsAt: new Date("2026-12-12T19:00:00.000Z"),
});

describe("lista de encontros por dia", () => {
  it("agrupa os encontros do mesmo dia, na ordem recebida", () => {
    const groups = groupByDay([meetup({}), sameDay, nextWeek]);
    expect(groups.map((g) => [g.key, g.meetups.map((m) => m.id)])).toEqual([
      ["2026-12-05", ["m1", "m2"]],
      ["2026-12-12", ["m3"]],
    ]);
  });

  it("mostra o dia, o dia da semana, o horário e as vagas", () => {
    render(<MeetupDays meetups={[meetup({})]} />);
    const day = screen.getByRole("heading", { level: 2 });
    expect(day).toHaveTextContent("5 de dez.");
    expect(day).toHaveTextContent("sábado");
    expect(screen.getByText("15h – 17h")).toBeInTheDocument();
    expect(screen.getByText("4 de 10 vagas ocupadas")).toBeInTheDocument();
    expect(screen.getByText("6 livres")).toBeInTheDocument();
  });

  it("marca os encontros em que a pessoa vai, os que ela criou e os lotados", () => {
    render(
      <MeetupDays
        meetups={[meetup({}), sameDay, nextWeek]}
        goingIds={new Set(["m1"])}
        createdIds={new Set(["m2"])}
      />,
    );
    const cards = screen.getAllByRole("listitem");
    expect(within(cards[0] as HTMLElement).getByText("Você vai")).toBeInTheDocument();
    expect(within(cards[1] as HTMLElement).getByText("Você criou")).toBeInTheDocument();
    expect(within(cards[2] as HTMLElement).queryByText("Você vai")).not.toBeInTheDocument();
  });

  it("mostra Lotado e Alterado", () => {
    render(
      <MeetupDays meetups={[meetup({ isFull: true, occupiedSeats: 10, editedAt: new Date() })]} />,
    );
    expect(screen.getByText("Lotado")).toBeInTheDocument();
    expect(screen.getByText("Alterado")).toBeInTheDocument();
  });

  it("não mostra etiqueta de público no card", () => {
    render(<MeetupDays meetups={[meetup({}), meetup({ id: "m4", communitySlug: "rpg" })]} />);

    expect(screen.queryByText("Aberto")).not.toBeInTheDocument();
    expect(screen.queryByText("RPG")).not.toBeInTheDocument();
  });

  it("cada card leva ao detalhe pelo título", () => {
    render(<MeetupDays meetups={[meetup({})]} />);

    expect(screen.getByRole("link", { name: "Café no centro" })).toHaveAttribute(
      "href",
      "/encontros/m1",
    );
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <MeetupDays
        meetups={[meetup({}), nextWeek, meetup({ id: "m4", communitySlug: "rpg" })]}
        goingIds={new Set(["m1"])}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
