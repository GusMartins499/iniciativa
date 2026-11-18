import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { PublicMeetup } from "@/modules/meetups/client";
import { MeetupFacts } from "./meetup-facts";

const meetup: PublicMeetup = {
  id: "m1",
  title: "Jogos",
  address: "Biblioteca Pública Municipal",
  placeDescription: "Sala do 2º andar.",
  startsAt: new Date("2026-12-12T17:00:00.000Z"),
  endsAt: new Date("2026-12-12T19:00:00.000Z"),
  capacity: 8,
  occupiedSeats: 2,
  status: "active",
  editedAt: null,
  communitySlug: null,
  isFull: false,
};

describe("detalhe do encontro", () => {
  it("mostra data por extenso, horário, duração e local", () => {
    render(<MeetupFacts meetup={meetup} />);
    expect(screen.getByText("Sábado, 12 de dezembro de 2026")).toBeInTheDocument();
    expect(screen.getByText("14h – 16h")).toBeInTheDocument();
    expect(screen.getByText("2 horas")).toBeInTheDocument();
    expect(screen.getByText("Sala do 2º andar.")).toBeInTheDocument();
  });

  it("leva o endereço para o mapa, com a cidade do piloto", () => {
    render(<MeetupFacts meetup={meetup} />);
    const link = screen.getByRole("link", { name: "Abrir no mapa" });
    expect(link.getAttribute("href")).toContain(
      encodeURIComponent("Biblioteca Pública Municipal, Tubarão - SC"),
    );
  });

  it("omite 'Sobre o local' quando não há descrição", () => {
    render(<MeetupFacts meetup={{ ...meetup, placeDescription: null }} />);
    expect(screen.queryByText("Sobre o local")).not.toBeInTheDocument();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<MeetupFacts meetup={meetup} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
