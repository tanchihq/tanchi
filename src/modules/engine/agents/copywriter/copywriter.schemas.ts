import { z } from "zod";

export const CopyOutputSchema = z.object({
  subject: z.string().nullish().transform((value) => value ?? null),
  body: z.string().min(1),
});

export type CopyOutput = z.infer<typeof CopyOutputSchema>;
