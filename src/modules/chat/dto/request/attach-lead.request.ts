import { z } from "zod";
import { AttachLeadErrors } from "../../chat.errors.ts";

export const AttachLeadDto = z.object({
  leadId: z.uuid({ message: AttachLeadErrors.invalidLeadId }),
});

export type AttachLeadDto = z.infer<typeof AttachLeadDto>;
