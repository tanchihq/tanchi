import { z } from "zod";

const CHANNELS = [
  "email",
  "linkedin",
  "whatsapp",
  "instagram",
  "sms",
  "call",
] as const;

export const ProfilerOutputSchema = z.object({
  summary: z.string(),
  qualification: z.enum(["A", "B", "C"]),
  score: z.number().min(0).max(100),
  channel: z.enum(CHANNELS),
  channelReason: z.string().nullish().transform((value) => value ?? ""),
  facts: z.array(
    z.object({
      text: z.string().min(1),
      sourceUrl: z.string().min(1),
      quote: z.string().min(1),
      provenance: z.enum(["own_source", "third_party"]),
    })
  ),
  angles: z.array(
    z.object({
      rank: z.number().int(),
      title: z.string().min(1),
      note: z.string().nullish().transform((value) => value ?? ""),
      angleType: z.string().min(1),
      factIndex: z.number().int(),
      chosen: z.boolean(),
    })
  ),
});

export type ProfilerOutput = z.infer<typeof ProfilerOutputSchema>;
