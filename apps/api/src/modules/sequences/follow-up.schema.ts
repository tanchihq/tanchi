import { z } from "zod";

export const CTA_TYPES = [
  "meeting",
  "question",
  "resource",
  "referral",
  "soft",
] as const;

export const PERSO_DEPTHS = ["deep", "medium", "shallow"] as const;

export const FollowUpOutputSchema = z.object({
  subject: z.string().nullish().transform((value) => value ?? null),
  body: z.string().min(1),
  ctaType: z
    .enum(CTA_TYPES)
    .nullish()
    .catch(null)
    .transform((value) => value ?? null),
  persoDepth: z
    .enum(PERSO_DEPTHS)
    .nullish()
    .catch(null)
    .transform((value) => value ?? null),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;
