import { createQueue, createWorker, scheduleRepeatable } from "@shared/queue";
import type { SequencesService } from "./sequences.service.ts";
import { SEQUENCES_CRON } from "./sequences.constants.ts";

const QUEUE_NAME = "sequences";

export function startSequencesWorker(
  sequencesService: SequencesService
): void {
  const queue = createQueue(QUEUE_NAME);

  createWorker(QUEUE_NAME, async () => {
    await sequencesService.processAllOrganizations();
    console.log("[sequences] follow-up pass complete");
  });

  void scheduleRepeatable(queue, "daily", SEQUENCES_CRON);
}
