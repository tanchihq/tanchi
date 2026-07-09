import type { Queue } from "bullmq";
import { createWorker, scheduleRepeatable } from "@shared/queue";
import type { AnalysteService } from "./agents/analyste/analyste.service.ts";
import type { EngineRepository } from "./repository/engine/engine.repository.ts";
import {
  ANALYSTE_QUEUE_NAME,
  ANALYSTE_WEEKLY_CRON,
} from "./engine.constants.ts";

type AnalysteJobData = Readonly<{ organizationId?: string }>;

export function startAnalysteWorker(
  queue: Queue,
  analysteService: AnalysteService,
  engineRepository: EngineRepository
): void {
  createWorker<AnalysteJobData>(ANALYSTE_QUEUE_NAME, async (job) => {
    const organizationId = job.data.organizationId;
    if (organizationId !== undefined) {
      const written = await analysteService.distill(organizationId);
      console.log(
        `[engine:analyste] org=${organizationId} → ${written} playbook(s)`
      );
      return;
    }

    const organizationIds = await engineRepository.getAllOrganizationIds();
    for (const id of organizationIds) {
      const written = await analysteService.distill(id);
      console.log(`[engine:analyste:weekly] org=${id} → ${written} playbook(s)`);
    }
  });

  void scheduleRepeatable(queue, "weekly", ANALYSTE_WEEKLY_CRON);
}
