import { z } from "zod";

export const FollowUpOutputSchema = z.object({
  subject: z.string().nullish().transform((value) => value ?? null),
  body: z.string().min(1),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;
