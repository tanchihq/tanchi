import { db } from "../../db.ts";
import { AutopilotPostgres } from "./repository/autopilot/autopilot.postgres.ts";
import { AutopilotRepository } from "./repository/autopilot/autopilot.repository.ts";
import { AutopilotService } from "./autopilot.service.ts";
import { createAutopilotRouter } from "./autopilot.controller.ts";
import { startAutopilotWorker } from "./autopilot.worker.ts";

const autopilotRepository = new AutopilotRepository(new AutopilotPostgres(db));
const autopilotService = new AutopilotService(autopilotRepository);

export const autopilotRouter = createAutopilotRouter(autopilotService);

export function startAutopilotWorkers(): void {
  startAutopilotWorker(autopilotService);
}
