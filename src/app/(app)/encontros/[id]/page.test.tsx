import { describe, expect, it, vi } from "vitest";
import type { canSeeMeetup as CanSeeMeetup, getMeetup as GetMeetup } from "@/modules/meetups";

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
});
