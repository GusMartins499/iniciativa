import type { rsvpsCopy } from "@/modules/rsvps";

export type RsvpActionState = { code: keyof typeof rsvpsCopy.errors | null };

export type RsvpStatus =
  | { kind: "creator" }
  | { kind: "started" }
  | { kind: "confirmed"; withCompanion: boolean }
  | { kind: "open"; full: boolean };
