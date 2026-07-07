import { createQueue, createWorker, scheduleRepeatable } from "@shared/queue";
import type { RewardService } from "./reward.service.ts";
import { REWARD_POLL_CRON } from "./reward.constants.ts";

const QUEUE_NAME = "reward-poll";

export function startRewardWorker(rewardService: RewardService): void {
  const queue = createQueue(QUEUE_NAME);

  createWorker(QUEUE_NAME, async () => {
    const processed = await rewardService.pollReplies();
    console.log(`[reward:poll] processed ${processed} replies`);
  });

  void scheduleRepeatable(queue, "poll", REWARD_POLL_CRON);
}
