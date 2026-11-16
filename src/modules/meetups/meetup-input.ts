import { z } from "zod";

// Data e hora locais (America/Sao_Paulo), como vêm do formulário.
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

export const meetupInputSchema = z.object({
  title: z.string().trim().min(1).max(100),
  startsAt: localDateTime,
  endsAt: localDateTime,
  address: z.string().trim().min(1).max(200),
  placeDescription: z.string().trim().max(1000).optional(),
  // O mínimo real é a ocupação do criador (1 ou 2), checada em CAPACITY_BELOW_OCCUPIED.
  capacity: z.number().int().min(1).max(50),
  publicPlace: z.literal(true),
  withCompanion: z.boolean(),
});

export type MeetupInput = z.infer<typeof meetupInputSchema>;

// O formulário pede uma data e dois horários; o encontro começa e termina no mesmo dia.
export const meetupFormSchema = z
  .object({
    title: meetupInputSchema.shape.title,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    address: meetupInputSchema.shape.address,
    placeDescription: z.string().trim().max(1000),
    capacity: meetupInputSchema.shape.capacity,
    publicPlace: z.boolean().refine((checked) => checked),
    withCompanion: z.boolean(),
  })
  .refine((form) => form.endTime > form.startTime, { path: ["endTime"] });

export type MeetupFormValues = z.infer<typeof meetupFormSchema>;

export function toMeetupInput(form: MeetupFormValues): MeetupInput {
  return {
    title: form.title,
    startsAt: `${form.date}T${form.startTime}`,
    endsAt: `${form.date}T${form.endTime}`,
    address: form.address,
    placeDescription: form.placeDescription || undefined,
    capacity: form.capacity,
    publicPlace: true,
    withCompanion: form.withCompanion,
  };
}
