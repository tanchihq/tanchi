import { db } from "../../db.ts";
import { llm } from "@shared/llm";
import { RewardPostgres } from "./repository/reward/reward.postgres.ts";
import { RewardRepository } from "./repository/reward/reward.repository.ts";
import { RewardService } from "./reward.service.ts";
import { startRewardWorker } from "./reward.worker.ts";

const rewardRepository = new RewardRepository(new RewardPostgres(db));
const rewardService = new RewardService(rewardRepository, llm);

export function startRewardWorkers(): void {
  startRewardWorker(rewardService);
}
