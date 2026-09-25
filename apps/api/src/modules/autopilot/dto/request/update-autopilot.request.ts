import { z } from "zod";
import { UpdateAutopilotErrors } from "../../autopilot.errors.ts";

export const UpdateAutopilotDto = z.object({
  enabled: z.boolean({ error: UpdateAutopilotErrors.invalidEnabled }),
});

export type UpdateAutopilotDto = z.infer<typeof UpdateAutopilotDto>;
