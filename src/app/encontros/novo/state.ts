import type { meetupsCopy } from "@/modules/meetups";

export type CreateMeetupState = {
  code: keyof typeof meetupsCopy.errors | null;
};
