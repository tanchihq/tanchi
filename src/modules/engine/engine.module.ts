import { db } from "../../db.ts";
import { env } from "../../env.ts";
import { llm } from "@shared/llm";
import { createSourcingProvider, type SourcingProvider } from "@shared/sourcing";
import { createQueue } from "@shared/queue";
import { EnginePostgres } from "./repository/engine/engine.postgres.ts";
import { EngineRepository } from "./repository/engine/engine.repository.ts";
import { ChasseurService } from "./agents/chasseur/chasseur.service.ts";
import { ProfilerService } from "./agents/profiler/profiler.service.ts";
import { CopywriterService } from "./agents/copywriter/copywriter.service.ts";
import { EngineService } from "./engine.service.ts";
import { createEngineRouter } from "./engine.controller.ts";
import { startEngineWorker } from "./engine.worker.ts";
import { ENGINE_QUEUE_NAME } from "./engine.constants.ts";

const engineRepository = new EngineRepository(new EnginePostgres(db));

const sourcing: SourcingProvider | null =
  env.HUNTER_API_KEY === undefined
    ? null
    : createSourcingProvider("hunter", env.HUNTER_API_KEY);

const chasseur = new ChasseurService(engineRepository, llm, sourcing);
const profiler = new ProfilerService(engineRepository, llm);
const copywriter = new CopywriterService(engineRepository, llm);

const engineService = new EngineService(
  engineRepository,
  chasseur,
  profiler,
  copywriter
);

const engineQueue = createQueue(ENGINE_QUEUE_NAME);

export const engineRouter = createEngineRouter(engineQueue);

export function startEngineWorkers(): void {
  startEngineWorker(engineQueue, engineService, engineRepository);
}
