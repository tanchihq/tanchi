import { z } from "zod";

export const DiscoveryOutputSchema = z.object({
  companies: z.array(
    z.object({
      name: z.string().min(1),
      domain: z.string().min(1),
      sector: z.string().nullish().transform((value) => value ?? null),
      size: z.string().nullish().transform((value) => value ?? null),
      hq: z.string().nullish().transform((value) => value ?? null),
    })
  ),
});

export type DiscoveryOutput = z.infer<typeof DiscoveryOutputSchema>;
