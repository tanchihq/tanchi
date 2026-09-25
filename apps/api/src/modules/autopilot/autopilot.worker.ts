import { createQueue, createWorker, scheduleRepeatable } from "@shared/queue";
import type { AutopilotService } from "./autopilot.service.ts";
import { AUTOPILOT_CRON, AUTOPILOT_QUEUE_NAME } from "./autopilot.constants.ts";

export function startAutopilotWorker(autopilotService: AutopilotService): void {
  const queue = createQueue(AUTOPILOT_QUEUE_NAME);

  createWorker(AUTOPILOT_QUEUE_NAME, async () => {
    const sent = await autopilotService.runAllOrganizations();
    if (sent > 0) console.log(`[autopilot] ${sent} email(s) sent automatically`);
  });

  void scheduleRepeatable(queue, "tick", AUTOPILOT_CRON);
}
