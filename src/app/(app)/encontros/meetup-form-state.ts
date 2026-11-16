import type { meetupsCopy } from "@/modules/meetups";

export type MeetupFormState = {
  code: keyof typeof meetupsCopy.errors | null;
};
