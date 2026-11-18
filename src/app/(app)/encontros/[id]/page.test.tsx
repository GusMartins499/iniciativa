import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  canSeeMeetup as CanSeeMeetup,
  getMeetup as GetMeetup,
  PublicMeetup,
} from "@/modules/meetups";

// A regra (aberto, membro, criador ou presença) tem teste no módulo; aqui só o 404.
const canSeeMeetup = vi.fn<typeof CanSeeMeetup>();
const getMeetup = vi.fn<typeof GetMeetup>();
vi.mock("@/modules/communities", () => ({ listMemberSlugs: async () => [] }));
vi.mock("@/modules/meetups", async () => {
  const { meetupsCopy } = await import("@/modules/meetups/client");
  return { meetupsCopy, canSeeMeetup, getMeetup, getCreatorId: async () => "creator" };
});
vi.mock("@/modules/rsvps", async () => {
  const { rsvpsCopy } = await import("@/modules/rsvps/client");
  return { rsvpsCopy, getUserRsvp: async () => null, listAttendeesForCreator: async () => null };
});
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("../../require-page-user", () => ({
  requirePageUser: async () => ({ id: "viewer", name: "Pessoa", email: "", image: null }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("./actions", () => ({
  cancelRsvpAction: async () => ({ code: null }),
  confirmRsvpAction: async () => ({ code: null }),
}));
vi.mock("@/modules/comments", async () => {
  const { commentsCopy } = await import("@/modules/comments/client");
  return {
    commentsCopy,
    listComments: async () => ({ ok: true, data: { comments: [], readOnly: false } }),
  };
});
vi.mock("./comment-actions", () => ({
  createCommentAction: async () => ({ code: null }),
  deleteCommentAction: async () => ({ code: null }),
  refreshCommentsAction: async () => undefined,
}));
vi.mock("./meetup-actions", () => ({ cancelMeetupAction: async () => ({ code: null }) }));

const { default: MeetupPage } = await import("./page");
const params = Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" });

describe("tela /encontros/[id]", () => {
  it("dá 404 para encontro de comunidade da qual a pessoa não participa", async () => {
    canSeeMeetup.mockResolvedValue({ visible: false, communitySlug: "rpg" });

    await expect(MeetupPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getMeetup).not.toHaveBeenCalled();
  });

  it("dá o mesmo 404 para encontro inexistente", async () => {
    canSeeMeetup.mockResolvedValue({ visible: false, communitySlug: null });

    await expect(MeetupPage({ params })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("mostra a comunidade do encontro, com cor e ícone, acima do título", async () => {
    canSeeMeetup.mockResolvedValue({ visible: true, communitySlug: "rpg" });
    getMeetup.mockResolvedValue({ ok: true, data: visibleMeetup({ communitySlug: "rpg" }) });

    render(await MeetupPage({ params }));

    const heading = screen.getByRole("heading", { level: 1, name: "Mesa de RPG" });
    const community = heading.previousElementSibling;
    expect(community).toHaveTextContent("RPG");
    expect(community?.querySelector('[data-community-icon="rpg"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("não mostra comunidade em encontro aberto", async () => {
    canSeeMeetup.mockResolvedValue({ visible: true, communitySlug: null });
    getMeetup.mockResolvedValue({ ok: true, data: visibleMeetup({ communitySlug: null }) });

    const { container } = render(await MeetupPage({ params }));

    expect(container.querySelector("[data-community-icon]")).toBeNull();
  });
});

function visibleMeetup(overrides: Partial<PublicMeetup>): PublicMeetup {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    title: "Mesa de RPG",
    address: "Rua X, 100",
    placeDescription: null,
    startsAt: new Date("2099-12-05T18:00:00.000Z"),
    endsAt: new Date("2099-12-05T20:00:00.000Z"),
    capacity: 5,
    occupiedSeats: 1,
    status: "active",
    editedAt: null,
    communitySlug: null,
    isFull: false,
    ...overrides,
  };
}
