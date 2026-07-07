import type { Queue } from "bullmq";
import { createWorker, scheduleRepeatable } from "@shared/queue";
import type { EngineService } from "./engine.service.ts";
import type { EngineRepository } from "./repository/engine/engine.repository.ts";
import {
  ENGINE_NIGHTLY_CRON,
  ENGINE_QUEUE_NAME,
} from "./engine.constants.ts";

type EngineJobData = Readonly<{ organizationId?: string }>;

export function startEngineWorker(
  queue: Queue,
  engineService: EngineService,
  engineRepository: EngineRepository
): void {
  createWorker<EngineJobData>(ENGINE_QUEUE_NAME, async (job) => {
    const organizationId = job.data.organizationId;
    if (organizationId !== undefined) {
      const result = await engineService.run(organizationId);
      console.log(
        `[engine:run] org=${organizationId} → ${JSON.stringify(result)}`
      );
      return;
    }

    const organizationIds =
      await engineRepository.getAllOrganizationIds();
    for (const id of organizationIds) {
      const result = await engineService.run(id);
      console.log(`[engine:nightly] org=${id} → ${JSON.stringify(result)}`);
    }
  });

  void scheduleRepeatable(queue, "nightly", ENGINE_NIGHTLY_CRON);
  void resumeUnfinishedRuns(queue, engineRepository);
}

async function resumeUnfinishedRuns(
  queue: Queue,
  engineRepository: EngineRepository
): Promise<void> {
  const organizationIds =
    await engineRepository.getOrganizationIdsWithUnfinishedRun();
  if (organizationIds.length === 0) return;
  await Promise.all(
    organizationIds.map((organizationId) =>
      queue.add(
        "resume",
        { organizationId },
        { removeOnComplete: true, removeOnFail: 100 }
      )
    )
  );
  console.log(
    `[engine:resume] ${organizationIds.length} run(s) inachevé(s) repris`
  );
}
